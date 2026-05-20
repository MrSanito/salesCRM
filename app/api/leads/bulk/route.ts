import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createBulkAuditLogs } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const body = await req.json();
    const { ids, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.stage) updateData.stage = data.stage;
    if (data.subStatus) updateData.subStatus = data.subStatus;
    if (data.priority) updateData.priority = data.priority;
    if (data.ownerId) updateData.ownerId = data.ownerId;
    if (data.sourceId) updateData.sourceId = data.sourceId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    // Verify all leads belong to the same organization
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId
      }
    });

    if (leads.length !== ids.length) {
      return NextResponse.json({ error: "One or more leads not found or unauthorized" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Perform bulk update
      await tx.lead.updateMany({
        where: {
          id: { in: ids },
          organizationId: user.organizationId
        },
        data: updateData
      });

      // Create bulk audit logs
      const auditLogsData = leads.map(lead => ({
        organizationId: user.organizationId,
        leadId: lead.id,
        actorType: "USER" as any,
        actorId: user.id,
        actorName: user.name || "Unknown User",
        action: "UPDATE",
        beforeValue: JSON.stringify(lead),
        afterValue: JSON.stringify({ ...lead, ...updateData }),
        note: `Bulk update performed by ${user.name}. Fields updated: ${Object.keys(updateData).join(", ")}.`,
        source: "UI" as any,
      }));

      await tx.auditLog.createMany({ data: auditLogsData, skipDuplicates: true });
    });

    return NextResponse.json({ message: `Successfully updated ${ids.length} leads` });
  } catch (error: any) {
    console.error("Error bulk updating leads:", error);
    return NextResponse.json({ error: error.message || "Failed to update leads" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify all leads belong to the same organization
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId
      }
    });

    if (leads.length !== ids.length) {
      return NextResponse.json({ error: "One or more leads not found or unauthorized" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Create bulk audit logs for deletion BEFORE deleting
      const auditLogsData = leads.map(lead => ({
        organizationId: user.organizationId,
        leadId: lead.id,
        actorType: "USER" as any,
        actorId: user.id,
        actorName: user.name || "Unknown User",
        action: "DELETE",
        beforeValue: JSON.stringify(lead),
        note: `Lead ${lead.contactName} from ${lead.company} deleted in bulk operation by ${user.name}.`,
        source: "UI" as any,
      }));

      await tx.auditLog.createMany({ data: auditLogsData, skipDuplicates: true });

      // Perform bulk delete
      await tx.lead.deleteMany({
        where: {
          id: { in: ids },
          organizationId: user.organizationId
        }
      });
    });

    return NextResponse.json({ message: `Successfully deleted ${ids.length} leads` });
  } catch (error: any) {
    console.error("Error bulk deleting leads:", error);
    return NextResponse.json({ error: error.message || "Failed to delete leads" }, { status: 500 });
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
    const { action, leads } = body;

    if (action !== "CREATE" || !leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Bulk handle Lead Sources
    const sourceNames = [...new Set(leads.map(l => l.source).filter(Boolean) as string[])];
    if (sourceNames.length > 0) {
      // Create missing sources in bulk
      await prisma.leadSource.createMany({
        data: sourceNames.map(name => ({
          name,
          organizationId: user.organizationId
        })),
        skipDuplicates: true
      });
    }

    // Map source names to IDs for the leads creation
    const allSources = await prisma.leadSource.findMany({
      where: { organizationId: user.organizationId }
    });
    const sourceMap = new Map(allSources.map(s => [s.name, s.id]));

    // 2. Bulk Create Leads and return their IDs (supported in Prisma 6+)
    const leadsToCreate = leads.map(l => ({
      contactName: l.contactName || "Unknown",
      company: l.company || "Unknown",
      phone: l.phone || null,
      phone2: l.phone2 || null,
      email: l.email || null,
      email2: l.email2 || null,
      requirement: l.requirement || null,
      industry: l.industry || null,
      dealValueInr: "0",
      stage: "NEW" as any,
      subStatus: "BLANK" as any,
      organizationId: user.organizationId,
      ownerId: user.id,
      createdById: user.id,
      sourceId: l.source ? sourceMap.get(l.source) : null,
      city: l.city || null,
      state: l.state || null,
    }));

    const createdLeads = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.createManyAndReturn({
        data: leadsToCreate,
        skipDuplicates: true
      });

      // 3. Bulk Create Notes
      const notesToCreate = [];
      for (let i = 0; i < leads.length; i++) {
        const originalLead = leads[i];
        if (originalLead.notes && created[i]) {
          notesToCreate.push({
            content: originalLead.notes,
            userId: user.id,
            organizationId: user.organizationId,
            leadId: created[i].id
          });
        }
      }

      if (notesToCreate.length > 0) {
        await tx.note.createMany({
          data: notesToCreate
        });
      }

      // 4. Bulk Create Audit Logs
      const auditLogsData = created.map(lead => ({
        organizationId: user.organizationId,
        leadId: lead.id,
        actorType: "USER" as any,
        actorId: user.id,
        actorName: user.name || "Unknown User",
        action: "CREATE",
        afterValue: JSON.stringify(lead),
        note: `Imported new lead protocol via bulk upload.`,
        source: "UI" as any,
      }));

      // Final summary log
      auditLogsData.push({
        organizationId: user.organizationId,
        leadId: null as any,
        actorType: "USER" as any,
        actorId: user.id,
        actorName: user.name || "Unknown User",
        action: "BULK_IMPORT",
        afterValue: null as any,
        note: `Successfully executed bulk import protocol for ${created.length} leads.`,
        source: "UI" as any,
      });

      await tx.auditLog.createMany({ data: auditLogsData, skipDuplicates: true });

      return created;
    });

    return NextResponse.json({ 
      message: `Successfully imported ${createdLeads.length} leads`,
      count: createdLeads.length
    });
  } catch (error: any) {
    console.error("Error bulk creating leads:", error);
    return NextResponse.json({ error: error.message || "Failed to import leads" }, { status: 500 });
  }
}
