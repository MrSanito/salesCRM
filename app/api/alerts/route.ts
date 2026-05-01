import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getAuthUser(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true },
    });
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const alerts = await prisma.alert.findMany({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
      include: {
        lead: { select: { contactName: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Alerts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.alert.deleteMany({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
    });

    // Create Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      actorType: "USER",
      actorId: user.id,
      action: "CLEAR_ALERTS",
      note: `Cleared all pending notification alerts from the dashboard.`,
      source: "UI",
    });

    return NextResponse.json({ message: "Alerts cleared" });
  } catch (error) {
    console.error("Alerts DELETE error:", error);
    return NextResponse.json({ error: "Failed to clear alerts" }, { status: 500 });
  }
}
