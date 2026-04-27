import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
        managerId: true,
        _count: {
          select: { ownedLeads: true }
        }
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
