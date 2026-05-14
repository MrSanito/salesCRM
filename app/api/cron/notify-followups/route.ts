import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushToUser } from "@/lib/sse-registry";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const fiftyFiveMinsAgo = new Date(now.getTime() - 55 * 60 * 1000);

  let followUpAlertsCount = 0;
  try {
    // 1. Leads
    const leads = await prisma.lead.findMany({
      where: {
        followUpAt: { gte: now, lte: oneHourFromNow },
        alerts: {
          none: {
            type: "FOLLOW_UP_DUE",
            createdAt: { gte: fiftyFiveMinsAgo }
          }
        }
      },
      include: {
        owner: true
      }
    });

    const triggeredAlerts: any[] = [];
    let followUpAlertsCount = 0;
    let reminderAlertsCount = 0;

    for (const lead of leads) {
      if (!lead.ownerId) continue;

      const alert = await prisma.alert.create({
        data: {
          userId: lead.ownerId,
          organizationId: lead.organizationId,
          leadId: lead.id,
          type: "FOLLOW_UP_DUE",
          title: "Follow-up Due Soon",
          body: `Follow-up with ${lead.contactName} (${lead.company}) is due within an hour.`,
        }
      });

      pushToUser(lead.ownerId, [{
        id: alert.id,
        type: alert.type,
        title: alert.title,
        body: alert.body,
        leadId: alert.leadId,
        contactName: lead.contactName,
        createdAt: alert.createdAt
      }]);
      followUpAlertsCount++;
      triggeredAlerts.push({ userId: lead.ownerId, leadName: lead.contactName, type: "FOLLOW_UP" });
    }

    // 2. Reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        scheduledAt: { gte: now, lte: oneHourFromNow },
        status: "PENDING"
      },
      include: {
        lead: true
      }
    });

    for (const reminder of reminders) {
      // Check if alert exists
      const existingAlert = await prisma.alert.findFirst({
        where: {
          userId: reminder.userId,
          leadId: reminder.leadId,
          type: "REMINDER_DUE",
          createdAt: { gte: fiftyFiveMinsAgo }
        }
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            userId: reminder.userId,
            organizationId: reminder.organizationId,
            leadId: reminder.leadId,
            type: "REMINDER_DUE",
            title: "Reminder Due Soon",
            body: `Reminder: ${reminder.type} with ${reminder.lead.contactName} is due within an hour.`,
          }
        });

        pushToUser(reminder.userId, [{
          id: alert.id,
          type: alert.type,
          title: alert.title,
          body: alert.body,
          leadId: alert.leadId,
          contactName: reminder.lead.contactName,
          createdAt: alert.createdAt
        }]);
        reminderAlertsCount++;
        triggeredAlerts.push({ userId: reminder.userId, leadName: reminder.lead.contactName, type: "REMINDER" });
      }
    }

    const debugLeads = await prisma.lead.findMany({
      where: { followUpAt: { not: null } },
      select: { contactName: true, followUpAt: true, ownerId: true },
      take: 5,
      orderBy: { followUpAt: 'asc' }
    });

    return NextResponse.json({ 
      followUpAlerts: followUpAlertsCount, 
      reminderAlerts: reminderAlertsCount,
      triggeredAlerts,
      now: now.toISOString(),
      debugLeads
    });
  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
