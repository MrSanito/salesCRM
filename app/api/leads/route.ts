import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

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
      select: { id: true, organizationId: true, role: true, name: true }
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
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const body = await req.json();
    const { name, company, phone, email, value, industry, requirement, notes, ownerId } = body;

    // Fetch user for org context and role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, role: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if lead already exists with this email or phone
    const existingLead = await prisma.lead.findFirst({
      where: {
        organizationId: user.organizationId,
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ].filter(condition => Object.values(condition)[0] !== undefined)
      }
    });

    if (existingLead) {
      return NextResponse.json({ error: "A lead with this email or phone already exists." }, { status: 400 });
    }

    // Determine owner: if worker, they are the owner. If manager/admin, they can specify.
    let finalOwnerId = userId;
    if (ownerId && (user.role === "ORG_ADMIN" || user.role === "MANAGER")) {
      finalOwnerId = ownerId;
    }

    const lead = await prisma.lead.create({
      data: {
        contactName: name,
        company,
        phone,
        email,
        requirement,
        industry,
        subStatus: body.subStatus || "CHATTING",
        dealValueInr: (value || 0).toString(),
        organizationId: user.organizationId,
        ownerId: finalOwnerId,
        createdById: userId,
        stage: "NEW",
        // Standalone note if provided
        notes: notes ? {
            create: {
                content: notes,
                userId: userId,
                organizationId: user.organizationId
            }
        } : undefined
      },
    });

    // Create Audit Log
    await createAuditLog({
      organizationId: user.organizationId,
      leadId: lead.id,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name || "Unknown User",
      action: "CREATE",
      afterValue: lead,
      note: `Sales owner ${user.name || "Unknown"} initialized a new lead protocol for ${lead.contactName} from ${lead.company}.`,
      source: "UI",
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
