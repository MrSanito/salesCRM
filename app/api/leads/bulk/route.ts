import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

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

    // Perform bulk update
    await prisma.lead.updateMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId
      },
      data: updateData
    });

    // Create Audit Logs for each lead
    for (const lead of leads) {
      await createAuditLog({
        organizationId: user.organizationId,
        leadId: lead.id,
        actorType: "USER",
        actorId: user.id,
        actorName: user.name || "Unknown User",
        action: "UPDATE",
        beforeValue: lead,
        afterValue: { ...lead, ...updateData },
        note: `Bulk update performed by ${user.name}. Fields updated: ${Object.keys(updateData).join(", ")}.`,
        source: "UI",
      });
    }

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

    // Perform bulk delete
    await prisma.lead.deleteMany({
      where: {
        id: { in: ids },
        organizationId: user.organizationId
      }
    });

    // Create Audit Logs for deletion
    // Note: Since leads are deleted, we log it before or as a general log
    for (const lead of leads) {
        await createAuditLog({
          organizationId: user.organizationId,
          leadId: lead.id,
          actorType: "USER",
          actorId: user.id,
          actorName: user.name || "Unknown User",
          action: "DELETE",
          beforeValue: lead,
          note: `Lead ${lead.contactName} from ${lead.company} deleted in bulk operation by ${user.name}.`,
          source: "UI",
        });
      }

    return NextResponse.json({ message: `Successfully deleted ${ids.length} leads` });
  } catch (error: any) {
    console.error("Error bulk deleting leads:", error);
    return NextResponse.json({ error: error.message || "Failed to delete leads" }, { status: 500 });
  }
}
