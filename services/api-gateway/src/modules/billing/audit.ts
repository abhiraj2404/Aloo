import { Prisma, type AuditAction } from "@repo/database";
import type { DbClient } from "./numbering";

export type WriteAuditParams = {
    shopId: string;
    userId?: string | null;
    action: AuditAction;
    entity: string;        // e.g. "BILL"
    entityId: string;
    metadata?: Record<string, unknown>;
};

export const writeAudit = (db: DbClient, params: WriteAuditParams) =>
    db.auditLog.create({
        data: {
            shopId: params.shopId,
            userId: params.userId ?? null,
            action: params.action,
            entity: params.entity,
            entityId: params.entityId,
            metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
    });

export const listAuditForBill = (db: DbClient, billId: string) =>
    db.auditLog.findMany({
        where: { entity: "BILL", entityId: billId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
    });
