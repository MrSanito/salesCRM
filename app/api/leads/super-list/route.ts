import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// UNIQUE_V12345
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const ownerId = searchParams.get("ownerId") || "";

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const baseWhere: any = {
      organizationId: user.organizationId,
    };

    if (user.role === "SALES_REP") {
      baseWhere.ownerId = user.id;
    } else if (ownerId) {
      baseWhere.ownerId = ownerId;
    }

    const queryWhere: any = { ...baseWhere };
    
    if (search) {
      queryWhere.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stage && stage !== "All Stages") {
      queryWhere.stage = stage;
    }

    const [leads, totalCount, statsData] = await Promise.all([
      prisma.lead.findMany({
        where: queryWhere,
        select: {
          id: true,
          contactName: true,
          company: true,
          email: true,
          phone: true,
          stage: true,
          dealValueInr: true,
          priority: true,
          subStatus: true,
          followUpAt: true,
          createdAt: true,
          industry: true,
          project: true,
          lastCommunicatedAt: true,
          requirement: true,
          owner: { select: { name: true, initials: true } },
          source: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where: queryWhere }),
      Promise.all([
        prisma.lead.groupBy({
          by: ["stage"],
          where: baseWhere,
          _count: { stage: true },
        }),
        prisma.lead.count({ where: { ...baseWhere, priority: "HIGH" } }),
        prisma.lead.aggregate({
          where: baseWhere,
          _sum: { dealValueInr: true },
        }),
        prisma.lead.count({ 
          where: { 
            ...baseWhere, 
            createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } 
          } 
        }),
        prisma.lead.count({ 
          where: { 
            ...baseWhere, 
            followUpAt: {
              gte: new Date(new Date().setHours(0,0,0,0)),
              lte: new Date(new Date().setHours(23,59,59,999))
            } 
          } 
        }),
        prisma.lead.count({ where: { ...baseWhere, stage: "WON" } }),
        // Added: Reminders for the dashboard
        prisma.reminder.findMany({
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
        }),
        // Added: Total new leads (for sidebar badge)
        prisma.lead.count({ where: { ...baseWhere, stage: "NEW" } }),
        // Added: Total follow ups (for sidebar badge)
        prisma.reminder.count({
          where: {
            organizationId: user.organizationId,
            ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
            status: "PENDING",
          }
        }),
      ])
    ]);

    const [stageCounts, alertsCount, totalValueAgg, newThisWeek, followUpsToday, wonDeals, reminders, newLeadsCount, followUpsTotal] = statsData;

    const countByStage = Object.fromEntries(stageCounts.map((s) => [s.stage, s._count.stage]));
    
    const PIPELINE_STAGES = ["NEW", "CONTACTED", "COLD", "CHATTING", "MEETING_SET", "NEGOTIATION", "CUSTOMER", "NOT_INTERESTED"];
    
    const stageLabelMap: Record<string, string> = {
      NEW: "New",
      CONTACTED: "Contacted",
      COLD: "Cold",
      CHATTING: "Chatting",
      NEGOTIATION: "Negotiation",
      MEETING_SET: "Meeting Set",
      CUSTOMER: "Customer",
      NOT_INTERESTED: "Not Interested",
    };
    const stageColorMap: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700 border-blue-200",
      CONTACTED: "bg-cyan-100 text-cyan-700 border-cyan-200",
      COLD: "bg-purple-100 text-purple-700 border-purple-200",
      CHATTING: "bg-purple-50 text-purple-600 border-purple-100",
      NEGOTIATION: "bg-amber-100 text-amber-700 border-amber-200",
      MEETING_SET: "bg-green-100 text-green-700 border-green-200",
      CUSTOMER: "bg-blue-600 text-white border-blue-700",
      NOT_INTERESTED: "bg-red-100 text-red-700 border-red-200",
    };

    const pipeline = PIPELINE_STAGES.map((s) => ({
      stage: s,
      count: countByStage[s] || 0,
      label: stageLabelMap[s] || s.replace(/_/g, ' '),
      color: stageColorMap[s] || "bg-slate-100 text-slate-700",
    }));

    return NextResponse.json({
      leads,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      stats: {
        pipeline,
        reminders,
        kpis: {
          totalLeads: totalCount,
          newLeadsThisWeek: newThisWeek,
          followUpsDueToday: followUpsToday,
          wonDeals: wonDeals,
          totalPipelineValue: Number(totalValueAgg._sum.dealValueInr || 0),
          alertsCount,
          newLeadsCount,
          followUpsTotal,
        }
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=10'
      }
    });

  } catch (error) {
    console.error("Super List API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
