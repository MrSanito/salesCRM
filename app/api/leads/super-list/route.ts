import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { withRouteTelemetry } from "@/lib/metrics";

// UNIQUE_V12345
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export const GET = withRouteTelemetry(async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const sidebarFilterId = searchParams.get("sidebarFilterId");

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, name: true, email: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const baseWhere: any = {
      organizationId: user.organizationId,
    };

    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";
    const view = searchParams.get("view");

    // Role-based access
    if (view === "subordinates" && (isOrgAdmin || isSuperAdmin)) {
      baseWhere.ownerId = { not: user.id };
    } else if (!isSuperAdmin) {
      baseWhere.ownerId = user.id;
    } else if (searchParams.get("ownerId")) {
      baseWhere.ownerId = searchParams.get("ownerId");
    }

    // Sidebar Filter Logic
    if (sidebarFilterId) {
      const sf = await prisma.sidebarFilter.findUnique({ where: { id: sidebarFilterId } });
      if (sf) {
        if (sf.statuses && sf.statuses.length > 0) baseWhere.stage = { in: sf.statuses };
        if (sf.subStatuses && sf.subStatuses.length > 0) baseWhere.subStatus = { in: sf.subStatuses };
        if (sf.industries && sf.industries.length > 0) baseWhere.industry = { in: sf.industries };
        if (sf.sources && sf.sources.length > 0) baseWhere.source = { name: { in: sf.sources } };
        if (sf.dealSizeMin) baseWhere.dealValueInr = { gte: sf.dealSizeMin };
        if (sf.dealSizeMax) baseWhere.dealValueInr = { ...baseWhere.dealValueInr, lte: sf.dealSizeMax };
        if (sf.alphabet) baseWhere.contactName = { startsWith: sf.alphabet, mode: 'insensitive' };
      }
    }

    const queryWhere: any = { ...baseWhere };
    
    // Handle search
    if (search) {
      queryWhere.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle column filters (filter_*)
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_") && value) {
        const field = key.replace("filter_", "");
        const values = value.split(",");
        
        if (field === "stage") {
          queryWhere.stage = { in: values };
        } else if (field === "subStatus") {
          queryWhere.subStatus = { in: values };
        } else if (field === "city") {
          queryWhere.city = { in: values };
        } else if (field === "state") {
          queryWhere.state = { in: values };
        } else if (field === "industry") {
          queryWhere.industry = { in: values };
        } else if (field === "source") {
          queryWhere.source = { name: { in: values } };
        } else if (field === "owner") {
          queryWhere.owner = { name: { in: values } };
        } else if (field === "followup") {
          const now = new Date();
          if (values.includes("OVERDUE")) {
            queryWhere.followUpAt = { lt: now };
          } else if (values.includes("TODAY")) {
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            queryWhere.followUpAt = { gte: new Date(now.setHours(0,0,0,0)), lte: endOfDay };
          }
        } else if (field === "createdAt") {
          const dateFilters = values.map(v => {
            const start = new Date(`${v}T00:00:00.000Z`);
            const end = new Date(`${v}T23:59:59.999Z`);
            return { createdAt: { gte: start, lte: end } };
          });
          if (dateFilters.length > 0) {
            if (!queryWhere.AND) queryWhere.AND = [];
            queryWhere.AND.push({ OR: dateFilters });
          }
        }
      }
    });

    // Handle sorting
    let orderBy: any = { [sortBy]: sortDir };
    if (sortBy === "lead") orderBy = { contactName: sortDir };

    const includeStats = searchParams.get("includeStats") === "true";
    
    let leads, totalCount, statsData;

    const leadSelect = {
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
      city: true,
      state: true,
      project: true,
      lastCommunicatedAt: true,
      requirement: true,
      owner: { select: { id: true, name: true, initials: true } },
      source: { select: { id: true, name: true } }
    } as const;

    if (includeStats) {
      const now = new Date();
      const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
      const endOfToday = new Date(now); endOfToday.setHours(23,59,59,999);
      const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      [leads, totalCount, statsData] = await Promise.all([
        prisma.lead.findMany({
          where: queryWhere,
          select: leadSelect,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.lead.count({ where: queryWhere }),
        Promise.all([
          // Stage counts — replaces separate NEW, WON, HIGH counts
          prisma.lead.groupBy({
            by: ["stage"],
            where: baseWhere,
            _count: { stage: true },
          }),
          // Pipeline value
          prisma.lead.aggregate({
            where: baseWhere,
            _sum: { dealValueInr: true },
            _count: { _all: true },
          }),
          // New this week
          prisma.lead.count({ 
            where: { ...baseWhere, createdAt: { gte: oneWeekAgo } } 
          }),
          // Follow-ups due today
          prisma.lead.count({ 
            where: { 
              ...baseWhere, 
              followUpAt: { gte: startOfToday, lte: endOfToday } 
            } 
          }),
          // Reminders for the dashboard
          prisma.reminder.findMany({
            where: {
              organizationId: user.organizationId,
              status: { in: ["PENDING", "SNOOZED"] },
              ...(!isSuperAdmin ? { userId: user.id } : {}),
            },
            include: {
              lead: { select: { contactName: true, company: true } },
              user: { select: { name: true, initials: true } },
            },
            orderBy: { scheduledAt: "asc" },
            take: 20,
          }),
          // Total pending follow-up reminders (for sidebar badge)
          prisma.reminder.count({
            where: {
              organizationId: user.organizationId,
              ...(!isSuperAdmin ? { userId: user.id } : {}),
              status: "PENDING",
            }
          }),
        ])
      ]);
    } else {
      [leads, totalCount] = await Promise.all([
        prisma.lead.findMany({
          where: queryWhere,
          select: leadSelect,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.lead.count({ where: queryWhere }),
      ]);
    }

    let stats: any = null;

    if (includeStats && statsData) {
      const [stageCounts, totalValueAgg, newThisWeek, followUpsToday, reminders, followUpsTotal] = statsData;

      const countByStage = Object.fromEntries(stageCounts.map((s: any) => [s.stage, s._count.stage]));
      
      // Derive counts from groupBy instead of separate queries
      const wonDeals = countByStage["WON"] || 0;
      const newLeadsCount = countByStage["NEW"] || 0;

      const PIPELINE_DISPLAY_STAGES = [
        { key: "NEW", label: "New" },
        { key: "CONTACTED", label: "Contacted" },
        { key: "COLD_CHATTING", label: "Cold Chatting" },
        { key: "MEETING_SET", label: "Meeting Set" },
        { key: "NEGOTIATION", label: "Negotiation" },
        { key: "CLIENT", label: "Client" },
        { key: "WON", label: "Won" },
        { key: "NOT_INTERESTED", label: "Not Interested" },
      ];
      
      const stageColorMap: Record<string, string> = {
        NEW: "bg-blue-50 text-blue-700 border-blue-100",
        CONTACTED: "bg-cyan-50 text-cyan-700 border-cyan-100",
        COLD_CHATTING: "bg-slate-50 text-slate-600 border-slate-100",
        NEGOTIATION: "bg-amber-50 text-amber-700 border-amber-100",
        MEETING_SET: "bg-indigo-50 text-indigo-700 border-indigo-100",
        CLIENT: "bg-blue-100 text-blue-700 border-blue-200",
        WON: "bg-green-100 text-green-700 border-green-200",
        NOT_INTERESTED: "bg-red-50 text-red-700 border-red-100",
      };

      const pipeline = PIPELINE_DISPLAY_STAGES.map((s) => {
        let count = 0;
        if (s.key === "COLD_CHATTING") {
          count = (countByStage["COLD"] || 0) + (countByStage["CHATTING"] || 0);
        } else {
          count = countByStage[s.key] || 0;
        }

        return {
          stage: s.key,
          count,
          label: s.label,
          color: stageColorMap[s.key] || "bg-slate-50 text-slate-700",
        };
      });

      stats = {
        pipeline,
        reminders,
        kpis: {
          totalLeads: totalCount,
          newLeadsThisWeek: newThisWeek,
          followUpsDueToday: followUpsToday,
          wonDeals,
          totalPipelineValue: Number(totalValueAgg._sum.dealValueInr || 0),
          alertsCount: 0, // No longer a separate query; can be derived client-side if needed
          newLeadsCount,
          followUpsTotal,
        }
      };
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      stats
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Super List API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
});


