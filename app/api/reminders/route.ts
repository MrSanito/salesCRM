import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getAuthUser(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true },
    });
  } catch { return null; }
}

// GET /api/reminders — fetch pending reminders for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminders = await prisma.reminder.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ["PENDING", "SNOOZED"] },
        ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
      },
      include: {
        lead: { select: { contactName: true, company: true } },
        user: { select: { name: true, initials: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Reminders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

// POST /api/reminders — create a new reminder (from ScheduleFollowupModal)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { leadId, type, description, scheduledAt } = await req.json();

    if (!leadId || !type || !scheduledAt) {
      return NextResponse.json({ error: "leadId, type, scheduledAt are required" }, { status: 400 });
    }

    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const reminder = await prisma.$transaction(async (tx) => {
      const r = await tx.reminder.create({
        data: {
          leadId,
          userId: user.id,
          organizationId: user.organizationId,
          type,
          description: description || null,
          scheduledAt: new Date(scheduledAt),
          status: "PENDING",
        },
        include: {
          lead: { select: { contactName: true, company: true } },
          user: { select: { name: true, initials: true } },
        },
      });

      // Update lead's followUpAt
      await tx.lead.update({
        where: { id: leadId },
        data: { followUpAt: new Date(scheduledAt) }
      });

      // Create Alert
      await tx.alert.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          leadId,
          type: "FOLLOW_UP_DUE",
          title: "Follow-up Scheduled",
          body: `${type} with ${r.lead.contactName} scheduled for ${new Date(scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        }
      });

      return r;
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Reminders POST error:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
