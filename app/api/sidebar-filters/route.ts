import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

// GET — all users in the org can read sidebar filters
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filters = await prisma.sidebarFilter.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { orderIndex: "asc" },
      include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json(filters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — only ORG_ADMIN can create
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Only the CEO can configure sidebar filters." }, { status: 403 });
    }

    const body = await req.json();
    const { name, status, subStatus, dealSizeMin, dealSizeMax, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get current max orderIndex
    const existing = await prisma.sidebarFilter.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { orderIndex: "desc" },
      take: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

    const filter = await prisma.sidebarFilter.create({
      data: {
        name,
        status: status || null,
        subStatus: subStatus || null,
        dealSizeMin: dealSizeMin ? parseFloat(dealSizeMin) : null,
        dealSizeMax: dealSizeMax ? parseFloat(dealSizeMax) : null,
        icon: icon || "filter",
        color: color || "blue",
        orderIndex: nextOrder,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });

    return NextResponse.json(filter, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — only ORG_ADMIN can delete
export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Only the CEO can delete sidebar filters." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Filter ID is required" }, { status: 400 });

    // Verify ownership
    const filter = await prisma.sidebarFilter.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!filter) return NextResponse.json({ error: "Filter not found" }, { status: 404 });

    await prisma.sidebarFilter.delete({ where: { id } });

    return NextResponse.json({ message: "Filter deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
