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

    const [rawIndustries, rawSources, rawCities, rawStates] = await Promise.all([
      prisma.lead.findMany({
        where: { organizationId: user.organizationId },
        select: { industry: true },
        distinct: ['industry'],
      }),
      prisma.leadSource.findMany({
        where: { organizationId: user.organizationId },
        select: { name: true },
        distinct: ['name'],
      }),
      prisma.lead.findMany({
        where: { organizationId: user.organizationId },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.lead.findMany({
        where: { organizationId: user.organizationId },
        select: { state: true },
        distinct: ['state'],
      }),
    ]);

    const industries = rawIndustries
      .map((i: { industry: string | null }) => i.industry)
      .filter((i): i is string => !!i && i.trim() !== "")
      .sort();

    const sources = rawSources
      .map((s: { name: string }) => s.name)
      .filter((name): name is string => !!name && name.trim() !== "")
      .sort();

    const cities = rawCities
      .map((c: { city: string | null }) => c.city)
      .filter((c): c is string => !!c && c.trim() !== "")
      .sort();

    const states = rawStates
      .map((s: { state: string | null }) => s.state)
      .filter((s): s is string => !!s && s.trim() !== "")
      .sort();

    return NextResponse.json({
      industries,
      sources,
      cities,
      states,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
