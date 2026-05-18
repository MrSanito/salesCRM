import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true },
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Single query to get all lead-based distinct values instead of 4 separate queries
    const [rawLeadFields, rawSources] = await Promise.all([
      prisma.lead.findMany({
        where: { organizationId: user.organizationId },
        select: { industry: true, city: true, state: true },
      }),
      prisma.leadSource.findMany({
        where: { organizationId: user.organizationId },
        select: { name: true },
        distinct: ['name'],
      }),
    ]);

    // Extract unique values in JS (faster than 3 separate DB roundtrips with DISTINCT)
    const industrySet = new Set<string>();
    const citySet = new Set<string>();
    const stateSet = new Set<string>();

    for (const row of rawLeadFields) {
      if (row.industry?.trim()) industrySet.add(row.industry.trim());
      if (row.city?.trim()) citySet.add(row.city.trim());
      if (row.state?.trim()) stateSet.add(row.state.trim());
    }

    const sources = rawSources
      .map((s: { name: string }) => s.name)
      .filter((name): name is string => !!name && name.trim() !== "")
      .sort();

    return NextResponse.json({
      industries: Array.from(industrySet).sort(),
      sources,
      cities: Array.from(citySet).sort(),
      states: Array.from(stateSet).sort(),
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
