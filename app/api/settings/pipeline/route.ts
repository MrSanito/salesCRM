import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAuditLog } from "@/lib/audit";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, organizationId: true, name: true, role: true },
    });
  } catch {
    return null;
  }
}

const DEFAULT_STATUSES = [
  { value: "NEW", label: "New", color: "blue", orderIndex: 0 },
  { value: "CONTACTED", label: "Contacted", color: "cyan", orderIndex: 1 },
  { value: "COLD", label: "Cold", color: "purple", orderIndex: 2 },
  { value: "CHATTING", label: "Cold Chatting", color: "indigo", orderIndex: 3 },
  { value: "MEETING_SET", label: "Meeting Set", color: "amber", orderIndex: 4 },
  { value: "NEGOTIATION", label: "Negotiation", color: "orange", orderIndex: 5 },
  { value: "NOT_INTERESTED", label: "Not Interested", color: "red", orderIndex: 6 },
  { value: "CLIENT", label: "Client", color: "green", orderIndex: 7 },
  { value: "WON", label: "Won", color: "green", orderIndex: 8 },
];

const DEFAULT_SUB_STATUSES = [
  { value: "BLANK", label: "Blank", color: "slate", orderIndex: 0 },
  { value: "CHATTING", label: "Chatting", color: "blue", orderIndex: 1 },
  { value: "NOT_ANSWERED", label: "Not Answered", color: "orange", orderIndex: 2 },
  { value: "WRONG_NO", label: "Wrong No.", color: "red", orderIndex: 3 },
  { value: "WARM_LEAD", label: "Warm Lead", color: "pink", orderIndex: 4 },
  { value: "PROPOSAL_SENT", label: "Proposal Sent", color: "purple", orderIndex: 5 },
  { value: "BUDGET_LOW", label: "Budget Low", color: "amber", orderIndex: 6 },
  { value: "NO_REQUIREMENT", label: "No Requirement", color: "slate", orderIndex: 7 },
  { value: "TEXTED", label: "Texted", color: "cyan", orderIndex: 8 },
];

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { organizationId } = user;

    // Concurrently fetch existing statuses and sub-statuses
    let [statuses, subStatuses] = await Promise.all([
      prisma.customStatus.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.customSubStatus.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    if (statuses.length === 0 || subStatuses.length === 0) {
      const initPromises = [];
      
      if (statuses.length === 0) {
        initPromises.push(
          prisma.customStatus.createMany({
            data: DEFAULT_STATUSES.map(s => ({ ...s, organizationId })),
          }).then(() => prisma.customStatus.findMany({
            where: { organizationId },
            orderBy: { orderIndex: "asc" },
          }))
        );
      } else {
        initPromises.push(Promise.resolve(statuses));
      }

      if (subStatuses.length === 0) {
        initPromises.push(
          prisma.customSubStatus.createMany({
            data: DEFAULT_SUB_STATUSES.map(ss => ({ ...ss, organizationId })),
          }).then(() => prisma.customSubStatus.findMany({
            where: { organizationId },
            orderBy: { orderIndex: "asc" },
          }))
        );
      } else {
        initPromises.push(Promise.resolve(subStatuses));
      }

      const results = await Promise.all(initPromises);
      statuses = results[0];
      subStatuses = results[1];
    }

    return NextResponse.json({ statuses, subStatuses }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAuthorized = user.role === "CEO" || user.role === "ORG_ADMIN";
    if (!isAuthorized) return NextResponse.json({ error: "Access Denied: Org Admin status required" }, { status: 403 });

    const body = await req.json();
    const { type, value, label, color } = body; // type is 'status' | 'substatus'

    if (!type || !value || !label) {
      return NextResponse.json({ error: "Type, value, and label are required" }, { status: 400 });
    }

    const { organizationId } = user;

    if (type === "status") {
      const newStatus = await prisma.$transaction(async (tx) => {
        // Get current max order
        const existing = await tx.customStatus.findMany({
          where: { organizationId },
          orderBy: { orderIndex: "desc" },
          take: 1,
        });
        const nextOrder = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

        const status = await tx.customStatus.create({
          data: {
            organizationId,
            value: value.toUpperCase(),
            label,
            color: color || "blue",
            orderIndex: nextOrder,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "CREATE_STATUS",
            field: "label",
            afterValue: label,
            note: `Created a new custom status: "${label}" (${value.toUpperCase()}).`,
            source: "UI",
          }
        });
        
        return status;
      });

      return NextResponse.json(newStatus, { status: 201 });
    } else if (type === "substatus") {
      const newSubStatus = await prisma.$transaction(async (tx) => {
        // Get current max order
        const existing = await tx.customSubStatus.findMany({
          where: { organizationId },
          orderBy: { orderIndex: "desc" },
          take: 1,
        });
        const nextOrder = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

        const subStatus = await tx.customSubStatus.create({
          data: {
            organizationId,
            value: value.toUpperCase(),
            label,
            color: color || "slate",
            orderIndex: nextOrder,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "CREATE_SUBSTATUS",
            field: "label",
            afterValue: label,
            note: `Created a new custom sub-status: "${label}" (${value.toUpperCase()}).`,
            source: "UI",
          }
        });
        
        return subStatus;
      });

      return NextResponse.json(newSubStatus, { status: 201 });
    } else {
      return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
    }
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "This option code already exists. Please choose a unique name." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAuthorized = user.role === "CEO" || user.role === "ORG_ADMIN";
    if (!isAuthorized) return NextResponse.json({ error: "Access Denied: Org Admin status required" }, { status: 403 });

    const body = await req.json();
    const { type, id, label, color, isEnabled, orderIndex } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const { organizationId } = user;

    if (type === "status") {
      const existing = await prisma.customStatus.findFirst({
        where: { id, organizationId },
      });
      if (!existing) return NextResponse.json({ error: "Status option not found" }, { status: 404 });

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.customStatus.update({
          where: { id },
          data: {
            ...(label && { label }),
            ...(color && { color }),
            ...(isEnabled !== undefined && { isEnabled }),
            ...(orderIndex !== undefined && { orderIndex }),
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "UPDATE_STATUS",
            field: "label",
            beforeValue: existing.label,
            afterValue: label || existing.label,
            note: `Updated custom status properties for "${existing.label}".`,
            source: "UI",
          }
        });
        
        return res;
      });

      return NextResponse.json(updated);
    } else if (type === "substatus") {
      const existing = await prisma.customSubStatus.findFirst({
        where: { id, organizationId },
      });
      if (!existing) return NextResponse.json({ error: "Sub-status option not found" }, { status: 404 });

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.customSubStatus.update({
          where: { id },
          data: {
            ...(label && { label }),
            ...(color && { color }),
            ...(isEnabled !== undefined && { isEnabled }),
            ...(orderIndex !== undefined && { orderIndex }),
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "UPDATE_SUBSTATUS",
            field: "label",
            beforeValue: existing.label,
            afterValue: label || existing.label,
            note: `Updated custom sub-status properties for "${existing.label}".`,
            source: "UI",
          }
        });
        
        return res;
      });

      return NextResponse.json(updated);
    } else {
      return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAuthorized = user.role === "CEO" || user.role === "ORG_ADMIN";
    if (!isAuthorized) return NextResponse.json({ error: "Access Denied: Org Admin status required" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    const { organizationId } = user;

    if (type === "status") {
      const response = await prisma.$transaction(async (tx) => {
        const existing = await tx.customStatus.findFirst({
          where: { id, organizationId },
        });
        if (!existing) return { error: "Status option not found", status: 404 };

        // Count leads using this raw value
        const activeLeadsCount = await tx.lead.count({
          where: {
            organizationId,
            stage: existing.value as any,
          },
        });

        if (activeLeadsCount > 0) {
          return {
            error: `Cannot delete status: ${activeLeadsCount} active lead(s) are currently in the "${existing.label}" status.`,
            status: 400
          };
        }

        await tx.customStatus.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "DELETE_STATUS",
            field: "label",
            beforeValue: existing.label,
            note: `Permanently deleted custom status option: "${existing.label}".`,
            source: "UI",
          }
        });
        
        return { success: true };
      });
      
      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: response.status });
      }

      return NextResponse.json({ message: "Status deleted successfully" });
    } else if (type === "substatus") {
      const response = await prisma.$transaction(async (tx) => {
        const existing = await tx.customSubStatus.findFirst({
          where: { id, organizationId },
        });
        if (!existing) return { error: "Sub-status option not found", status: 404 };

        // Count leads using this raw value
        const activeLeadsCount = await tx.lead.count({
          where: {
            organizationId,
            subStatus: existing.value as any,
          },
        });

        if (activeLeadsCount > 0) {
          return {
            error: `Cannot delete sub-status: ${activeLeadsCount} active lead(s) are currently in the "${existing.label}" sub-status.`,
            status: 400
          };
        }

        await tx.customSubStatus.delete({ where: { id } });
        await tx.auditLog.create({
          data: {
            organizationId,
            actorType: "USER",
            actorId: user.id,
            actorName: user.name || "Unknown",
            action: "DELETE_SUBSTATUS",
            field: "label",
            beforeValue: existing.label,
            note: `Permanently deleted custom sub-status option: "${existing.label}".`,
            source: "UI",
          }
        });
        
        return { success: true };
      });
      
      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: response.status });
      }

      return NextResponse.json({ message: "Sub-status deleted successfully" });
    } else {
      return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
