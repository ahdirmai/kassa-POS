import { prisma } from "./prisma.js";

export async function writeAuditLog(params: {
  outletId?: number;
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  reason?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        outletId: params.outletId ?? 1,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId != null ? String(params.entityId) : null,
        reason: params.reason ?? null,
        beforeValue: params.beforeValue !== undefined ? JSON.stringify(params.beforeValue) : null,
        afterValue: params.afterValue !== undefined ? JSON.stringify(params.afterValue) : null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("Failed writing audit log:", err);
  }
}
