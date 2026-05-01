import { prisma } from "./prisma";
import { ActorType, SourceType } from "@prisma/client";

interface AuditLogParams {
  organizationId: string;
  leadId?: string;
  actorType: ActorType;
  actorId?: string;
  actorName?: string;
  action: string;
  field?: string;
  beforeValue?: any;
  afterValue?: any;
  note?: string;
  source: SourceType;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        leadId: params.leadId,
        actorType: params.actorType,
        actorId: params.actorId,
        actorName: params.actorName,
        action: params.action,
        field: params.field,
        beforeValue: params.beforeValue ? JSON.stringify(params.beforeValue) : null,
        afterValue: params.afterValue ? JSON.stringify(params.afterValue) : null,
        note: params.note,
        source: params.source,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
