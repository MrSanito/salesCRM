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
      select: { id: true, organizationId: true },
    });
  } catch {
    return null;
  }
}

export const GET = withRouteTelemetry(async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use Prisma's findMany with distinct to get unique values directly from the database
    // This avoids fetching all leads into memory
    const [rawIndustries, rawCities, rawStates, rawSources, rawUsers] = await Promise.all([
      prisma.lead.findMany({
        where: { organizationId: user.organizationId, industry: { not: null, not: "" } },
        select: { industry: true },
        distinct: ['industry'],
      }),
      prisma.lead.findMany({
        where: { organizationId: user.organizationId, city: { not: null, not: "" } },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.lead.findMany({
        where: { organizationId: user.organizationId, state: { not: null, not: "" } },
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
