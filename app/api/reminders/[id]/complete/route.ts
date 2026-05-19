import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

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
      select: { id: true, organizationId: true, role: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(!isSuperAdmin ? { userId: user.id } : {}),
      },
    });

    if (!reminder) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.reminder.update({
        where: { id },
        data: { status: "DONE", completedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          leadId: reminder.leadId,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name,
          action: "COMPLETE_REMINDER",
          field: "status",
          beforeValue: reminder.status,
          afterValue: "DONE",
          note: `Successfully completed and closed the ${reminder.type.toLowerCase()} follow-up task originally scheduled for ${new Date(reminder.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short" })}.`,
          source: "UI",
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder complete error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
