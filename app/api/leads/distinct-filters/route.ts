import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { withRouteTelemetry } from "@/lib/metrics";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, role: true, email: true },
    });
  } catch {
    return null;
  }
}

export const GET = withRouteTelemetry(async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO";

    // Build the base where clause scoped by role — mirrors super-list logic
    const baseWhere: any = { organizationId: user.organizationId };

    if (view === "subordinates") {
      // Subordinate view: same scoping as super-list
      if (isSuperAdmin || isOrgAdmin) {
        // Admins see all leads EXCEPT their own
        baseWhere.ownerId = { not: user.id };
      } else if (user.role === "MANAGER") {
        const subordinates = await prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true },
        });
        const subIds = subordinates.map((s) => s.id);
        baseWhere.ownerId = subIds.length > 0 ? { in: subIds } : { in: ["__none__"] };
      } else {
        baseWhere.ownerId = "__none__"; // no leads for non-manager/non-admin
      }
    } else if (!isSuperAdmin && !isOrgAdmin) {
      if (user.role === "MANAGER") {
        const subordinates = await prisma.user.findMany({
          where: { managerId: user.id },
          select: { id: true },
        });
        const subIds = subordinates.map((s) => s.id);
        baseWhere.ownerId = { in: [...subIds, user.id] };
      } else {
        // Regular user — only their own leads
        baseWhere.ownerId = user.id;
      }
    }
    const stageFilter = searchParams.get("stageFilter") || searchParams.get("filter_stage");
    const ownerFilter = searchParams.get("ownerFilter") || searchParams.get("filter_ownerId");

    if (stageFilter) {
      const stages = stageFilter.split(",");
      const expandedStages: string[] = [];
      stages.forEach(st => {
        if (st === "COLD_CHATTING") expandedStages.push("COLD", "CHATTING", "COLD_CHATTING");
        else expandedStages.push(st);
      });
      baseWhere.stage = { in: expandedStages };
    }

    if (ownerFilter && ownerFilter !== "all") {
      const selectedOwnerIds = ownerFilter.split(",");
      if (baseWhere.ownerId !== undefined) {
        if (typeof baseWhere.ownerId === "object" && baseWhere.ownerId !== null) {
          if (Array.isArray(baseWhere.ownerId.in)) {
            const intersection = selectedOwnerIds.filter(id => baseWhere.ownerId.in.includes(id));
            baseWhere.ownerId = intersection.length > 0 ? { in: intersection } : { in: ["__none__"] };
          } else if (baseWhere.ownerId.not !== undefined) {
            const allowedIds = selectedOwnerIds.filter(id => id !== baseWhere.ownerId.not);
            baseWhere.ownerId = allowedIds.length > 0 ? { in: allowedIds } : { in: ["__none__"] };
          } else {
            baseWhere.ownerId = { in: ["__none__"] };
          }
        } else {
          if (selectedOwnerIds.includes(baseWhere.ownerId)) {
            baseWhere.ownerId = { in: [baseWhere.ownerId] };
          } else {
            baseWhere.ownerId = { in: ["__none__"] };
          }
        }
      } else {
        baseWhere.ownerId = { in: selectedOwnerIds };
      }
    }

    // Parse other filters to enable dynamic scoping (faceted search)
    const search = searchParams.get("search") || "";
    const sidebarFilterId = searchParams.get("sidebarFilterId");

    const sf = sidebarFilterId ? await prisma.sidebarFilter.findUnique({ where: { id: sidebarFilterId } }) : null;
    const sfWhere: any = {};
    if (sf) {
      if (sf.statuses && sf.statuses.length > 0) sfWhere.stage = { in: sf.statuses };
      if (sf.subStatuses && sf.subStatuses.length > 0) sfWhere.subStatus = { in: sf.subStatuses };
      if (sf.industries && sf.industries.length > 0) sfWhere.industry = { in: sf.industries };
      if (sf.sources && sf.sources.length > 0) sfWhere.source = { name: { in: sf.sources } };
      if (sf.dealSizeMin) sfWhere.dealValueInr = { gte: sf.dealSizeMin };
      if (sf.dealSizeMax) sfWhere.dealValueInr = { ...sfWhere.dealValueInr, lte: sf.dealSizeMax };
      if (sf.alphabet) sfWhere.contactName = { startsWith: sf.alphabet, mode: 'insensitive' };
      if (sf.ownerId) {
        if (isSuperAdmin || isOrgAdmin) {
          sfWhere.ownerId = sf.ownerId;
        } else if (user.role === "MANAGER") {
          const subordinates = await prisma.user.findMany({
            where: { managerId: user.id },
            select: { id: true }
          });
          const allowedIds = [...subordinates.map(s => s.id), user.id];
          if (allowedIds.includes(sf.ownerId)) {
            sfWhere.ownerId = sf.ownerId;
          } else {
            sfWhere.ownerId = "none";
          }
        } else {
          if (sf.ownerId === user.id) {
            sfWhere.ownerId = user.id;
          } else {
            sfWhere.ownerId = "none";
          }
        }
      }
    }

    const searchWhere: any = {};
    if (search) {
      searchWhere.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const colFiltersWhere: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_") && value) {
        const field = key.replace("filter_", "");
        if (field === "stage" || field === "ownerId" || field === "owner") return;
        
        const values = value.split(",");
        if (field === "subStatus") {
          colFiltersWhere.subStatus = { in: values };
        } else if (field === "city") {
          colFiltersWhere.city = { in: values };
        } else if (field === "state") {
          colFiltersWhere.state = { in: values };
        } else if (field === "industry") {
          colFiltersWhere.industry = { in: values };
        } else if (field === "source") {
          colFiltersWhere.source = { name: { in: values } };
        } else if (field === "followup") {
          const now = new Date();
          if (values.includes("OVERDUE")) {
            colFiltersWhere.followUpAt = { lt: now };
          } else if (values.includes("TODAY")) {
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            colFiltersWhere.followUpAt = { gte: new Date(now.setHours(0,0,0,0)), lte: endOfDay };
          }
        } else if (field === "createdAt") {
          const dateFilters = values.map(v => {
            const start = new Date(`${v}T00:00:00.000Z`);
            const end = new Date(`${v}T23:59:59.999Z`);
            return { createdAt: { gte: start, lte: end } };
          });
          if (dateFilters.length > 0) {
            colFiltersWhere.createdAt = { OR: dateFilters };
          }
        }
      }
    });

    const getWhereForField = (exceptField?: string) => {
      const where: any = {
        ...baseWhere,
        ...sfWhere,
        ...searchWhere,
      };

      Object.entries(colFiltersWhere).forEach(([field, filterClause]) => {
        if (field !== exceptField) {
          if (field === "createdAt" && filterClause.OR) {
            if (!where.AND) where.AND = [];
            where.AND.push({ OR: filterClause.OR });
          } else {
            where[field] = filterClause;
          }
        }
      });

      return where;
    };

    // Use Prisma's findMany with distinct to get unique values directly from the database
    // This avoids fetching all leads into memory
    const [rawIndustries, rawCities, rawStates, rawSources, rawUsers] = await Promise.all([
      prisma.lead.findMany({
        where: { ...getWhereForField("industry"), industry: { not: null } },
        select: { industry: true },
        distinct: ['industry'],
      }),
      prisma.lead.findMany({
        where: { ...getWhereForField("city"), city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.lead.findMany({
        where: { ...getWhereForField("state"), state: { not: null } },
        select: { state: true },
        distinct: ['state'],
      }),
      prisma.lead.findMany({
        where: { ...getWhereForField("source"), sourceId: { not: null } },
        select: {
          source: {
            select: { name: true }
          }
        },
        distinct: ['sourceId'],
      }),
      prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, name: true },
      }),
    ]);

    const industries = rawIndustries
      .map((r: any) => r.industry?.trim())
      .filter(Boolean)
      .sort();

    const cities = rawCities
      .map((r: any) => r.city?.trim())
      .filter(Boolean)
      .sort();

    const states = rawStates
      .map((r: any) => r.state?.trim())
      .filter(Boolean)
      .sort();

    const sources = Array.from(
      new Set(
        rawSources
          .map((r: any) => r.source?.name?.trim())
          .filter((name: any): name is string => !!name && name !== "")
      )
    ).sort();

    const owners = Array.from(new Set(rawUsers.map((u: any) => u.name?.trim()).filter(Boolean))).sort();
    const ownerDetails = rawUsers.map((u: any) => ({ id: u.id, name: u.name?.trim() })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      industries,
      sources,
      cities,
      states,
      owners,
      ownerDetails,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

