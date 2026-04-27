import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// PATCH /api/reminders/[id]/complete — mark a reminder as DONE
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const updated = await prisma.reminder.updateMany({
      where: {
        id,
        organizationId: user.organizationId,
        // SALES_REP can only mark their own reminders done
        ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
      },
      data: { status: "DONE", completedAt: new Date() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder complete error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
