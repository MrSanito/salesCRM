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
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO" || user.role === "MANAGER";

    // Fetch Lead, Notes, and Team in parallel to minimize latency
    const [lead, team] = await Promise.all([
      prisma.lead.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
          ...(!(isSuperAdmin || isOrgAdmin) ? { ownerId: user.id } : {}),
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
    const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "CEO" || user.role === "MANAGER";

    // Run the entire series of database writes inside a single transaction to minimize latency and round-trips
    const response = await prisma.$transaction(async (tx) => {
      // Check if lead exists and belongs to org
      const existingLead = await tx.lead.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingLead) return { error: "Lead not found", status: 404 };

      // Authorization: Standard workers (non-admin/non-manager/non-super-admin) can only update stage/value of their own leads
      if (!isSuperAdmin && !isOrgAdmin && existingLead.ownerId !== user.id) {
        return { error: "Forbidden", status: 403 };
      }

      // Role-based restrictions: Only super-admin or org-admin/CEO/manager can change owner
      if (data.ownerId && !isSuperAdmin && !isOrgAdmin) {
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

      const auditLogs: any[] = [];

      // 1. Handle source tracking changes
      if (data.source !== undefined) {
        if (!data.source) {
          updateData.sourceId = null;
        } else {
          const leadSource = await tx.leadSource.upsert({
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

      // 2. Handle missing action checks & audit logs for note updates
      if (data.notes !== undefined) {
        const existingNote = await tx.note.findFirst({
          where: { leadId: id },
          orderBy: { createdAt: 'asc' },
          select: { id: true, content: true }
        });
        
        if (existingNote) {
          if (existingNote.content !== data.notes) {
            await tx.note.update({
              where: { id: existingNote.id },
              data: { content: data.notes || "" }
            });
            auditLogs.push({
              organizationId: user.organizationId,
              leadId: id,
              actorType: "USER" as const,
              actorId: user.id,
              actorName: user.name || "Unknown",
              action: "UPDATE_NOTE",
              field: "notes",
              beforeValue: existingNote.content,
              afterValue: data.notes || "",
              note: "Updated lead intelligence notes.",
              source: "UI" as const,
            });
          }
        } else if (data.notes) {
          await tx.note.create({
            data: {
              content: data.notes,
              leadId: id,
              userId: user.id,
              organizationId: user.organizationId
            }
          });
          auditLogs.push({
            organizationId: user.organizationId,
            leadId: id,
            actorType: "USER" as const,
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "CREATE_NOTE",
            field: "notes",
            beforeValue: "",
            afterValue: data.notes,
            note: "Created initial lead intelligence notes.",
            source: "UI" as const,
          });
        }
      }

      // 3. Scan for other standard field changes
      for (const [key, afterValue] of Object.entries(updateData)) {
        if (key === "sourceId" || key === "notes") continue; // Handled separately
        
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
            note: `Updated protocol field '${key}' from '${beforeValue || "None"}' to '${afterValue || "None"}'.`,
            source: "UI" as const,
          });
        }
      }

      // 4. Handle human-readable changes for source updates instead of raw UUIDs
      if (data.source !== undefined) {
        const oldSourceName = existingLead.sourceId 
          ? (await tx.leadSource.findUnique({ where: { id: existingLead.sourceId }, select: { name: true } }))?.name 
          : "None";
        const newSourceName = data.source || "None";
        
        if (oldSourceName !== newSourceName) {
          auditLogs.push({
            organizationId: user.organizationId,
            leadId: id,
            actorType: "USER" as const,
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "UPDATE_SOURCE",
            field: "source",
            beforeValue: oldSourceName || "None",
            afterValue: newSourceName,
            note: `Changed acquisition source from '${oldSourceName || "None"}' to '${newSourceName}'.`,
            source: "UI" as const,
          });
        }
      }

      // 5. Apply core lead updates
      const updated = await tx.lead.update({
        where: { id },
        data: updateData,
        include: {
          owner: { select: { name: true, initials: true } },
          source: { select: { name: true } },
        }
      });

      // 6. Write all bulk audit logs directly to database inside the same transaction
      if (auditLogs.length > 0) {
        const formattedLogs = auditLogs.map(log => ({
          organizationId: log.organizationId,
          leadId: log.leadId,
          actorType: log.actorType,
          actorId: log.actorId,
          actorName: log.actorName,
          action: log.action,
          field: log.field,
          beforeValue: log.beforeValue ? String(log.beforeValue) : null,
          afterValue: log.afterValue ? String(log.afterValue) : null,
          note: log.note,
          source: log.source || "UI",
        }));

        await tx.auditLog.createMany({
          data: formattedLogs,
          skipDuplicates: true
        });
      }

      return { updated };
    });

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: response.status });
    }

    return NextResponse.json(response.updated);
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

    const response = await prisma.$transaction(async (tx) => {
      // Check if lead exists and belongs to org
      const existingLead = await tx.lead.findFirst({
        where: { id, organizationId: user.organizationId }
      });

      if (!existingLead) return { error: "Lead not found", status: 404 };

      // Create Audit Log for deletion
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          leadId: id,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown",
          action: "DELETE",
          note: `Permanently deleted lead protocol for ${existingLead.contactName} from ${existingLead.company}.`,
          source: "UI",
        }
      });

      // Delete lead (cascades should handle related notes/logs if configured, but lead itself is primary)
      await tx.lead.delete({
        where: { id }
      });
      
      return { success: true };
    });

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
