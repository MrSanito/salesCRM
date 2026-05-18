import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushToUser } from "@/lib/sse-registry";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const urlObj = new URL(req.url);
  const querySecret = urlObj.searchParams.get("secret");
  const validSecret = process.env.CRON_SECRET || process.env.METRICS_SECRET || "your_random_secret_here";

  // Flexible authorization supporting Vercel automatic bearer headers, custom headers, and query secrets for manual browser testing
  const isAuthorized = 
    authHeader === `Bearer ${validSecret}` || 
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === validSecret ||
    (process.env.CRON_SECRET && querySecret === process.env.CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const triggeredAlerts: any[] = [];
  let followUpAlertsCount = 0;
  let reminderAlertsCount = 0;

  try {
    // 1. Process Leads: Find all leads with overdue/pending followUpAt times
    const leads = await prisma.lead.findMany({
      where: {
        followUpAt: { lte: now }
      },
      include: {
        owner: true,
        alerts: {
          where: {
            type: "FOLLOW_UP_DUE"
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    for (const lead of leads) {
      if (!lead.ownerId || !lead.followUpAt) continue;

      const lastAlert = lead.alerts[0];
      // Skip if already alerted for this specific follow-up slot
      if (lastAlert && lastAlert.createdAt >= lead.followUpAt) {
        continue;
      }

      const alert = await prisma.alert.create({
        data: {
          userId: lead.ownerId,
          organizationId: lead.organizationId,
          leadId: lead.id,
          type: "FOLLOW_UP_DUE",
          title: "Follow-up Due Soon",
          body: `Follow-up with ${lead.contactName} (${lead.company}) is due.`,
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

    // 2. Process Reminders: Find all reminders that are due/overdue
    const reminders = await prisma.reminder.findMany({
      where: {
        scheduledAt: { lte: now },
        status: "PENDING"
      },
      include: {
        lead: true
      }
    });

    for (const reminder of reminders) {
      // Find if we already sent a notification alert after the scheduled date/time
      const existingAlert = await prisma.alert.findFirst({
        where: {
          userId: reminder.userId,
          leadId: reminder.leadId,
          type: "REMINDER_DUE",
          createdAt: { gte: reminder.scheduledAt }
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
            body: `Reminder: ${reminder.type} with ${reminder.lead.contactName} is due.`,
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
      success: true,
      followUpAlerts: followUpAlertsCount, 
      reminderAlerts: reminderAlertsCount,
      triggeredAlerts,
      now: now.toISOString(),
      debugLeads
    });
  } catch (error: any) {
    console.error("Cron notification error:", error);
    return NextResponse.json({ error: "Failed to process notifications", details: error.message }, { status: 500 });
  }
}
