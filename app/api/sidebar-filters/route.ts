import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true, role: true },
    });
  } catch {
    return null;
  }
}

// GET — fetch user-specific sidebar filters
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // TEMPORARY CLEANUP: Remove Meeting Set and Closed
    await prisma.sidebarFilter.deleteMany({
      where: {
        createdById: user.id,
        name: { in: ["Meeting Set", "Closed"] }
      }
    });

    const filters = await prisma.sidebarFilter.findMany({
      where: { createdById: user.id },
      orderBy: { orderIndex: "asc" },
      include: { 
        createdBy: { select: { name: true } },
        owner: { select: { name: true } }
      },
    });

    // Re-map stored [COLD, CHATTING] → COLD_CHATTING for the frontend
    const normalizedFilters = filters.map((f) => {
      const hasCold = f.statuses.includes("COLD" as any);
      const hasChatting = f.statuses.includes("CHATTING" as any);
      if (hasCold && hasChatting) {
        return {
          ...f,
          statuses: [
            ...f.statuses.filter((s: any) => s !== "COLD" && s !== "CHATTING"),
            "COLD_CHATTING",
          ],
        };
      }
      return f;
    });

    return NextResponse.json(normalizedFilters, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — allow any authorized user to create their own sidebar filters
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, statuses, subStatuses, industries, sources, dealSizeMin, dealSizeMax, alphabet, icon, color, ownerId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get current max orderIndex for this user's filters
    const existing = await prisma.sidebarFilter.findMany({
      where: { createdById: user.id },
      orderBy: { orderIndex: "desc" },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

    // Map virtual COLD_CHATTING → [COLD, CHATTING] so Prisma accepts it
    const sanitizedStatuses: string[] = [];
    for (const st of (statuses || [])) {
      if (st === "COLD_CHATTING") {
        if (!sanitizedStatuses.includes("COLD")) sanitizedStatuses.push("COLD");
        if (!sanitizedStatuses.includes("CHATTING")) sanitizedStatuses.push("CHATTING");
      } else {
        sanitizedStatuses.push(st);
      }
    }

    const isAdmin = user.role === "CEO" || user.role === "ORG_ADMIN";

    const filter = await prisma.sidebarFilter.create({
      data: {
        name,
        statuses: sanitizedStatuses as any,
        subStatuses: subStatuses || [],
        // Remove WARM_LEAD from subStatuses if COLD_CHATTING was selected (it's auto-excluded in query)

        industries: industries || [],
        sources: sources || [],
        dealSizeMin: dealSizeMin ? parseFloat(dealSizeMin) : null,
        dealSizeMax: dealSizeMax ? parseFloat(dealSizeMax) : null,
        alphabet: alphabet || null,
        icon: icon || "filter",
        color: color || "blue",
        orderIndex: nextOrder,
        organizationId: user.organizationId,
        createdById: user.id,
        ownerId: isAdmin && ownerId ? ownerId : null,
      },
      include: {
        createdBy: { select: { name: true } },
        owner: { select: { name: true } }
      }
    });

    // Create Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name || "Unknown",
      action: "CREATE_FILTER",
      field: "name",
      afterValue: name,
      note: `Configured a new sidebar filter protocol: "${name}".`,
      source: "UI",
    });

    return NextResponse.json(filter, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — allow users to delete their own sidebar filters
export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Filter ID is required" }, { status: 400 });

    // Verify ownership
    const filter = await prisma.sidebarFilter.findFirst({
      where: { id, createdById: user.id },
    });
    if (!filter) return NextResponse.json({ error: "Filter not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.sidebarFilter.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown",
          action: "DELETE_FILTER",
          field: "name",
          beforeValue: filter.name,
          note: `Permanently removed sidebar filter protocol: "${filter.name}".`,
          source: "UI",
        }
      })
    ]);

    return NextResponse.json({ message: "Filter deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
