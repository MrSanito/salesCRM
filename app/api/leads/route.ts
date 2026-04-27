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
    
    // Fetch user to get organizationId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role-based filtering:
    // SALES_REP: only their own leads
    // MANAGER/ORG_ADMIN: all leads in organization
    const whereClause: any = {
      organizationId: user.organizationId,
    };

    if (user.role === "SALES_REP") {
      whereClause.ownerId = decoded.userId;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { name: true, initials: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await req.json();
    const { name, company, phone, email, value, source, requirements, notes, ownerId } = body;

    // Fetch user for org context and role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine owner: if worker, they are the owner. If manager/admin, they can specify.
    let finalOwnerId = decoded.userId;
    if (ownerId && (user.role === "ORG_ADMIN" || user.role === "MANAGER")) {
      finalOwnerId = ownerId;
    }

    const lead = await prisma.lead.create({
      data: {
        contactName: name,
        company,
        phone,
        email,
        dealValueInr: value.toString() || "0",
        organizationId: user.organizationId,
        ownerId: finalOwnerId,
        createdById: decoded.userId,
        stage: "NEW",
        // Standalone note if provided
        notes: notes ? {
            create: {
                content: notes,
                userId: decoded.userId,
                organizationId: user.organizationId
            }
        } : undefined
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
