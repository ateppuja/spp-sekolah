import prisma from "./prisma";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Record an audit log entry for administrative or financial operations
 */
export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.beforeData ? JSON.stringify(params.beforeData) : null,
        afterData: params.afterData ? JSON.stringify(params.afterData) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Do not throw so primary transactions are not blocked by log failures
  }
}
