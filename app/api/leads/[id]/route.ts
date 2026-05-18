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
    
    // Optimized user fetch: get organizationId once
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { organizationId: true, role: true, id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

    // Fetch Lead, Notes, and Team in parallel to minimize latency
    const [lead, team] = await Promise.all([
      prisma.lead.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
          ...(!isSuperAdmin ? { ownerId: user.id } : {}),
        },
        include: {
          owner: { select: { name: true, initials: true } },
          source: { select: { name: true } },
          notes: {
            include: { user: { select: { name: true, initials: true, role: true } } },
            orderBy: { updatedAt: "desc" },
          },
          reminders: {
            orderBy: { scheduledAt: 'desc' },
            take: 5,
            select: {
              id: true, type: true, status: true, scheduledAt: true, 
              completedAt: true, description: true, createdAt: true,
            }
          }
        },
      }),
      prisma.user.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          initials: true,
          managerId: true,
          _count: { select: { ownedLeads: true } }
        },
        orderBy: { createdAt: 'asc' },
      })
    ]);

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Combine lead and team into a single response
    return NextResponse.json({
      ...lead,
      team_members: team // Inject team directly into response to save a separate call
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Lead GET error:", error);
    return NextResponse.json({ error: "Failed to fetch lead dossier" }, { status: 500 });
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
      select: { organizationId: true, role: true, id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const data = await req.json();
    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

    // Check if lead exists and belongs to org
    const existingLead = await prisma.lead.findFirst({
      where: { id, organizationId: user.organizationId }
    });

    if (!existingLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Authorization: Workers (non-super-admins) can only update stage/value of their own leads
    if (!isSuperAdmin && existingLead.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Role-based restrictions: Only super-admin can change owner
    if (data.ownerId && !isSuperAdmin) {
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
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.state !== undefined && { state: data.state || null }),
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
      const existingNote = await prisma.note.findFirst({
        where: { leadId: id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, content: true, leadId: true, userId: true, organizationId: true }
      });
      
      if (existingNote) {
        await prisma.note.update({
          where: { id: existingNote.id },
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
    const auditLogs: any[] = [];
    for (const [key, afterValue] of Object.entries(updateData)) {
      const beforeValue = (existingLead as any)[key];
      if (beforeValue?.toString() !== afterValue?.toString()) {
        auditLogs.push({
          organizationId: user.organizationId,
          leadId: id,
          actorType: "USER" as const,
          actorId: user.id,
          actorName: user.name || "Unknown",
          action: "UPDATE",
          field: key,
          beforeValue: beforeValue?.toString(),
          afterValue: afterValue?.toString(),
          note: `Updated protocol field '${key}' from '${beforeValue}' to '${afterValue}'.`,
          source: "UI" as const,
        });
      }
    }

    if (auditLogs.length > 0) {
      // Fire-and-forget: don't block response for audit logging
      import("@/lib/audit").then(m => m.createBulkAuditLogs(auditLogs)).catch(console.error);
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
      select: { organizationId: true, role: true, id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSuperAdmin = user.email === "sb.solobuild@gmail.com";

    // Only super-admin can delete
    if (!isSuperAdmin) {
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
