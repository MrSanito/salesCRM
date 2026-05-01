import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true },
    });
    
    if (!user || (user.role !== "ORG_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500, // Limit for performance
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Audit Report GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit report" }, { status: 500 });
  }
}
