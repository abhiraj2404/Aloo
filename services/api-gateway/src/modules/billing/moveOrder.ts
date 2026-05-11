import { ApiError } from "../../utils/ApiError";
import type { DbClient } from "./numbering";
import { writeAudit } from "./audit";

// Move an order from its current table session to a different table. If the target
// table has an open session → attach. Otherwise → spawn a new session on the target.
// Source session is left in place (its other orders may still be running) UNLESS this
// was its only order, in which case we close it.
export const moveOrderToTable = async (
    db: DbClient,
    params: { orderId: string; targetTableId: string; shopId: string; userId?: string | null },
) => {
    const { orderId, targetTableId, shopId, userId } = params;

    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            tableSession: {
                select: {
                    id: true,
                    tableId: true,
                    customerId: true,
                    bills: { where: { parentBillId: null }, select: { id: true } },
                },
            },
        },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.shopId !== shopId) throw new ApiError(403, "You do not have access to this order");
    if (order.status === "CANCELLED" || order.status === "COMPLETED") {
        throw new ApiError(400, "Cannot move a cancelled or completed order");
    }
    if (!order.tableSessionId || !order.tableSession) {
        throw new ApiError(400, "Order is not attached to a table");
    }
    if (order.tableSession.bills.length > 0) {
        throw new ApiError(400, "Cannot move an order from a billed session");
    }
    if (order.tableSession.tableId === targetTableId) {
        throw new ApiError(400, "Order is already on this table");
    }

    const targetTable = await db.table.findUnique({ where: { id: targetTableId } });
    if (!targetTable || targetTable.deletedAt) throw new ApiError(404, "Target table not found");
    if (targetTable.shopId !== shopId) throw new ApiError(403, "Target table belongs to another shop");

    // Find or create the target session
    let targetSession = await db.tableSession.findFirst({
        where: { shopId, tableId: targetTableId, endedAt: null },
    });

    // Block move into a session that's already been billed (parent bill present)
    if (targetSession) {
        const targetBill = await db.bill.findFirst({
            where: { tableSessionId: targetSession.id, parentBillId: null },
        });
        if (targetBill) throw new ApiError(400, "Target table session has already been billed");
    }

    if (!targetSession) {
        targetSession = await db.tableSession.create({
            data: {
                shopId,
                tableId: targetTableId,
                userId: userId ?? null,
                customerId: order.tableSession.customerId,
            },
        });
    }

    const sourceSessionId = order.tableSessionId;

    await db.order.update({
        where: { id: orderId },
        data: { tableSessionId: targetSession.id },
    });

    // Close the source session if it has no remaining orders
    const remaining = await db.order.count({
        where: { tableSessionId: sourceSessionId },
    });
    if (remaining === 0) {
        await db.tableSession.update({
            where: { id: sourceSessionId },
            data: { endedAt: new Date() },
        });
    }

    await writeAudit(db, {
        shopId,
        userId,
        action: "ORDER_MOVED",
        entity: "ORDER",
        entityId: orderId,
        metadata: { from: sourceSessionId, to: targetSession.id, targetTableId },
    });

    return targetSession.id;
};
