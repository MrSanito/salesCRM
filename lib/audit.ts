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
  source?: SourceType;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    console.log(`[Audit] Creating log: ${params.action} for lead ${params.leadId} by ${params.actorName}`);
    const log = await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        leadId: params.leadId,
        actorType: params.actorType,
        actorId: params.actorId,
        actorName: params.actorName,
        action: params.action,
        field: params.field,
        beforeValue: params.beforeValue ? (typeof params.beforeValue === 'object' ? JSON.stringify(params.beforeValue) : String(params.beforeValue)) : null,
        afterValue: params.afterValue ? (typeof params.afterValue === 'object' ? JSON.stringify(params.afterValue) : String(params.afterValue)) : null,
        note: params.note,
        source: params.source || "UI",
      },
    });
    console.log(`[Audit] Log created successfully: ${log.id}`);
    return log;
  } catch (error) {
    console.error("[Audit] Failed to create audit log:", error);
  }
}
