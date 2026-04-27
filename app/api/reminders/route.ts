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

    const reminders = await prisma.reminder.findMany({
      where: {
        organizationId: user.organizationId,
        status: "PENDING",
        ...(user.role === "SALES_REP" ? { userId: user.id } : {}),
      },
      include: {
        lead: { select: { contactName: true, company: true } },
        user: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Reminders error:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}
