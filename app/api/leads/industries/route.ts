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

    const industries = await prisma.lead.findMany({
      where: { organizationId: user.organizationId },
      select: { industry: true },
      distinct: ['industry'],
    });

    const list = industries
      .map(i => i.industry)
      .filter((i): i is string => !!i && i.trim() !== "")
      .sort();

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
