import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true, id: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        // SALES_REP can only view their own leads
        ...(user.role === "SALES_REP" ? { ownerId: user.id } : {}),
      },
      include: {
        owner: { select: { name: true, initials: true } },
        source: { select: { name: true } },
        notes: {
          orderBy: { createdAt: 'asc' },
          take: 1
        },
        reminders: {
          orderBy: { scheduledAt: 'desc' }
        }
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });


    return NextResponse.json(lead);
  } catch (error) {
    console.error("Lead GET error:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true, id: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const data = await req.json();

    // Check if lead exists and belongs to org
    const existingLead = await prisma.lead.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!existingLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Authorization: Workers can only update stage/value of their own leads
    if (user.role === "SALES_REP" && existingLead.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Role-based restrictions: Only ORG_ADMIN and MANAGER can change owner
    if (data.ownerId && (user.role !== "ORG_ADMIN" && user.role !== "MANAGER")) {
      delete data.ownerId;
    }

    const updateData: any = {
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.email2 !== undefined && { email2: data.email2 || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.phone2 !== undefined && { phone2: data.phone2 || null }),
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dealValueInr !== undefined && { dealValueInr: data.dealValueInr ? data.dealValueInr.toString().replace(/[^0-9.]/g, '') : "0" }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.requirement !== undefined && { requirement: data.requirement || null }),
      ...(data.industry !== undefined && { industry: data.industry || null }),
      ...(data.subStatus !== undefined && { subStatus: data.subStatus }),
      ...(data.project !== undefined && { project: data.project || null }),
      ...(data.followUpAt !== undefined && { followUpAt: data.followUpAt ? new Date(data.followUpAt) : null }),
      ...(data.closedAt !== undefined && { closedAt: data.closedAt ? new Date(data.closedAt) : null }),
    };

    if (data.source !== undefined) {
      if (!data.source) {
        updateData.sourceId = null;
      } else {
        const leadSource = await prisma.leadSource.upsert({
          where: {
            name_organizationId: {
              name: data.source,
              organizationId: user.organizationId
            }
          },
          update: {},
          create: {
            name: data.source,
            organizationId: user.organizationId
          }
        });
        updateData.sourceId = leadSource.id;
      }
    }

    if (data.notes !== undefined) {
      const firstNote = await prisma.note.findFirst({
        where: { leadId: id },
        orderBy: { createdAt: 'asc' }
      });
      
      if (firstNote) {
        await prisma.note.update({
          where: { id: firstNote.id },
          data: { content: data.notes || "" }
        });
      } else if (data.notes) {
        await prisma.note.create({
          data: {
            content: data.notes,
            leadId: id,
            userId: user.id,
            organizationId: user.organizationId
          }
        });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { name: true, initials: true } },
        source: { select: { name: true } },
      }
    });

    // Create Audit Logs for changes
    for (const [key, afterValue] of Object.entries(updateData)) {
      const beforeValue = (existingLead as any)[key];
      if (beforeValue?.toString() !== afterValue?.toString()) {
        await createAuditLog({
          organizationId: user.organizationId,
          leadId: id,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown",
          action: "UPDATE",
          field: key,
          beforeValue: beforeValue?.toString(),
          afterValue: afterValue?.toString(),
          note: `Updated protocol field '${key}' from '${beforeValue}' to '${afterValue}'.`,
          source: "UI",
        });
      }
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Lead PATCH error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true, id: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only ORG_ADMIN and MANAGER can delete
    if (user.role !== "ORG_ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if lead exists and belongs to org
    const existingLead = await prisma.lead.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!existingLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Create Audit Log for deletion
    await createAuditLog({
      organizationId: user.organizationId,
      leadId: id,
      actorType: "USER",
      actorId: user.id,
      actorName: user.name || "Unknown",
      action: "DELETE",
      note: `Permanently deleted lead protocol for ${existingLead.contactName} from ${existingLead.company}.`,
      source: "UI",
    });

    // Delete lead (cascades should handle related notes/logs if configured, but lead itself is primary)
    await prisma.lead.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
