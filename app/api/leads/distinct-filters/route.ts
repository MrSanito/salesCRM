import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { withRouteTelemetry } from "@/lib/metrics";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, email: true },
    });
  } catch {
    return null;
  }
}

export const GET = withRouteTelemetry(async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";

    // Build the base where clause scoped by role — mirrors super-list logic
    const baseWhere: any = { organizationId: user.organizationId };

    if (view === "subordinates") {
      // Subordinate view: same scoping as super-list
      if (isSuperAdmin || isOrgAdmin) {
        // Admins see all leads EXCEPT their own
        baseWhere.ownerId = { not: user.id };
      } else if (user.role === "MANAGER") {
        const subordinates = await prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true },
        });
        const subIds = subordinates.map((s) => s.id);
        baseWhere.ownerId = subIds.length > 0 ? { in: subIds } : { in: ["__none__"] };
      } else {
        baseWhere.ownerId = "__none__"; // no leads for non-manager/non-admin
      }
    } else if (!isSuperAdmin && !isOrgAdmin) {
      if (user.role === "MANAGER") {
        const subordinates = await prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true },
        });
        const subIds = subordinates.map((s) => s.id);
        baseWhere.ownerId = { in: [...subIds, user.id] };
      } else {
        // Regular user — only their own leads
        baseWhere.ownerId = user.id;
      }
    }

    // Use Prisma's findMany with distinct to get unique values directly from the database
    // This avoids fetching all leads into memory
    const [rawIndustries, rawCities, rawStates, rawSources, rawUsers] = await Promise.all([
      prisma.lead.findMany({
        where: { ...baseWhere, industry: { not: null } },
        select: { industry: true },
        distinct: ['industry'],
      }),
      prisma.lead.findMany({
        where: { ...baseWhere, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.lead.findMany({
        where: { ...baseWhere, state: { not: null } },
        select: { state: true },
        distinct: ['state'],
      }),
      prisma.leadSource.findMany({
        where: { organizationId: user.organizationId },
        select: { name: true },
        distinct: ['name'],
      }),
      prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, name: true },
      }),
    ]);

    const industries = rawIndustries
      .map((r: any) => r.industry?.trim())
      .filter(Boolean)
      .sort();

    const cities = rawCities
      .map((r: any) => r.city?.trim())
      .filter(Boolean)
      .sort();

    const states = rawStates
      .map((r: any) => r.state?.trim())
      .filter(Boolean)
      .sort();

    const sources = rawSources
      .map((s: { name: string }) => s.name)
      .filter((name): name is string => !!name && name.trim() !== "")
      .sort();

    const owners = Array.from(new Set(rawUsers.map((u: any) => u.name?.trim()).filter(Boolean))).sort();
    const ownerDetails = rawUsers.map((u: any) => ({ id: u.id, name: u.name?.trim() })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      industries,
      sources,
      cities,
      states,
      owners,
      ownerDetails,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

