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
    // 1 & 2. Process Leads and Reminders concurrently
    const [leads, reminders] = await Promise.all([
      prisma.lead.findMany({
        where: { followUpAt: { lte: now } },
        include: {
          owner: true,
          alerts: {
            where: { type: "FOLLOW_UP_DUE" },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.reminder.findMany({
        where: { scheduledAt: { lte: now }, status: "PENDING" },
        include: { lead: true }
      })
    ]);

    // Batch-fetch existing REMINDER_DUE alerts
    const existingReminderAlerts = reminders.length > 0 
      ? await prisma.alert.findMany({
          where: {
            type: "REMINDER_DUE",
            OR: reminders.map(r => ({
              userId: r.userId,
              leadId: r.leadId,
              createdAt: { gte: r.scheduledAt }
            }))
          },
          select: { userId: true, leadId: true }
        })
      : [];

    const alertedSet = new Set(existingReminderAlerts.map(a => `${a.userId}:${a.leadId}`));
    const alertsToCreate: { query: any, context: any }[] = [];

    // Prepare lead alerts
    for (const lead of leads) {
      if (!lead.ownerId || !lead.followUpAt) continue;

      const lastAlert = lead.alerts[0];
      if (lastAlert && lastAlert.createdAt >= lead.followUpAt) continue;

      alertsToCreate.push({
        query: prisma.alert.create({
          data: {
            userId: lead.ownerId,
            organizationId: lead.organizationId,
            leadId: lead.id,
            type: "FOLLOW_UP_DUE",
            title: "Follow-up Due Soon",
            body: `Follow-up with ${lead.contactName} (${lead.company}) is due.`,
          }
        }),
        context: { userId: lead.ownerId, leadName: lead.contactName, type: "FOLLOW_UP" }
      });
    }

    // Prepare reminder alerts
    for (const reminder of reminders) {
      const key = `${reminder.userId}:${reminder.leadId}`;
      if (alertedSet.has(key)) continue;

      alertsToCreate.push({
        query: prisma.alert.create({
          data: {
            userId: reminder.userId,
            organizationId: reminder.organizationId,
            leadId: reminder.leadId,
            type: "REMINDER_DUE",
            title: "Reminder Due Soon",
            body: `Reminder: ${reminder.type} with ${reminder.lead.contactName} is due.`,
          }
        }),
        context: { userId: reminder.userId, leadName: reminder.lead.contactName, type: "REMINDER" }
      });
    }

    // Execute all alert creations in a single transaction
    if (alertsToCreate.length > 0) {
      const createdAlerts = await prisma.$transaction(alertsToCreate.map(a => a.query));

      createdAlerts.forEach((alert, i) => {
        const ctx = alertsToCreate[i].context;
        pushToUser(ctx.userId, [{
          id: alert.id,
          type: alert.type,
          title: alert.title,
          body: alert.body,
          leadId: alert.leadId,
          contactName: ctx.leadName,
          createdAt: alert.createdAt
        }]);

        if (ctx.type === "FOLLOW_UP") followUpAlertsCount++;
        else reminderAlertsCount++;

        triggeredAlerts.push(ctx);
      });
    }

    return NextResponse.json({ 
      success: true,
      followUpAlerts: followUpAlertsCount, 
      reminderAlerts: reminderAlertsCount,
      triggeredAlerts,
      now: now.toISOString()
    });
  } catch (error: any) {
    console.error("Cron notification error:", error);
    return NextResponse.json({ error: "Failed to process notifications", details: error.message }, { status: 500 });
  }
}
