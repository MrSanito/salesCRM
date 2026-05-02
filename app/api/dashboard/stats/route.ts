import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true, id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const baseWhere: any = { organizationId: user.organizationId };
    if (user.role === "SALES_REP") baseWhere.ownerId = user.id;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 30);

    const [
      totalLeads,
      newLeadsThisWeek,
      followUpsDueToday,
      wonDeals,
      stageCounts,
      totalPipelineValue,
      newLeadsCount,
      alertsCount,
      followUpsTotal,
    ] = await Promise.all([
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.count({ where: { ...baseWhere, createdAt: { gte: startOfWeek } } }),
      prisma.reminder.count({
        where: {
          organizationId: user.organizationId,
          ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
          status: "PENDING",
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.lead.count({ where: { ...baseWhere, stage: "WON" } }),
      prisma.lead.groupBy({
        by: ["stage"],
        where: baseWhere,
        _count: { stage: true },
      }),
      prisma.lead.aggregate({
        where: baseWhere,
        _sum: { dealValueInr: true },
      }),
      prisma.lead.count({ where: { ...baseWhere, stage: "NEW" } }),
      prisma.lead.count({ where: { ...baseWhere, priority: "HIGH" } }),
      prisma.reminder.count({
        where: {
          organizationId: user.organizationId,
          ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
          status: "PENDING",
        },
      }),
    ]);

    // Stage distribution for pipeline
    const stageOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "CLOSED_LOST"];
    const stageLabelMap: Record<string, string> = {
      NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
      PROPOSAL_SENT: "Proposal", NEGOTIATION: "Negotiation",
      WON: "Won", CLOSED_LOST: "Lost",
    };
    const stageColorMap: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700 border-blue-200",
      CONTACTED: "bg-cyan-100 text-cyan-700 border-cyan-200",
      QUALIFIED: "bg-indigo-100 text-indigo-700 border-indigo-200",
      PROPOSAL_SENT: "bg-amber-100 text-amber-700 border-amber-200",
      NEGOTIATION: "bg-orange-100 text-orange-700 border-orange-200",
      WON: "bg-green-100 text-green-700 border-green-200",
      CLOSED_LOST: "bg-red-100 text-red-700 border-red-200",
    };

    const countByStage = Object.fromEntries(stageCounts.map((s) => [s.stage, s._count.stage]));
    const pipeline = stageOrder.map((stage) => ({
      label: stageLabelMap[stage] || stage,
      count: countByStage[stage] || 0,
      color: stageColorMap[stage] || "bg-slate-100 text-slate-700",
    }));

    const totalValue = Number(totalPipelineValue._sum.dealValueInr || 0);

    return NextResponse.json({
      kpis: {
        totalLeads,
        newLeadsThisWeek,
        followUpsDueToday,
        wonDeals,
        totalPipelineValue: totalValue,
        alertsCount,
        newLeadsCount,
        followUpsTotal,
      },
      pipeline,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
