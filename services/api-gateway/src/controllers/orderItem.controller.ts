import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import { UpdateOrderItemStatusSchema } from "@repo/types";
import { orderEvents } from "./order.controller";

const ORDER_INCLUDES = {
    orderItems: true,
    tableSession: { include: { table: true } },
    customer: { select: { id: true, phone: true, name: true } },
    kot: { select: { id: true, kotNumber: true, isSupplementary: true, printedAt: true } },
} as const;

// Roll the parent Order.status from item statuses. Keep it minimal — we only auto-flip
// PENDING/CONFIRMED → PREPARING when any item starts being made, and PREPARING → COMPLETED
// when every (non-VOID) item is SERVED. Captain-driven states (CANCELLED, manual moves)
// are left alone.
const rollOrderStatus = (
    currentStatus: string,
    items: { status: string }[],
): string | null => {
    if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") return null;

    const active = items.filter((i) => i.status !== "VOID");
    if (active.length === 0) return null;

    const allServed = active.every((i) => i.status === "SERVED");
    if (allServed) return "COMPLETED";

    // Any item touched (READY/SERVED) and order still PENDING/CONFIRMED → PREPARING
    const anyTouched = active.some((i) => i.status === "READY" || i.status === "SERVED");
    if (anyTouched && (currentStatus === "PENDING" || currentStatus === "CONFIRMED")) {
        return "PREPARING";
    }

    return null;
};

// PATCH /order-item/:id/status — flips one item's kitchen-side state and recomputes
// the parent Order's status rollup in the same transaction.
export const updateOrderItemStatus = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "OrderItemId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = UpdateOrderItemStatusSchema.safeParse(req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const existing = await prisma.orderItem.findUnique({
        where: { id },
        include: { order: { select: { id: true, shopId: true, status: true } } },
    });
    if (!existing) throw new ApiError(404, "Order item not found");
    if (existing.order.shopId !== shopId) {
        throw new ApiError(403, "You do not have access to this order item");
    }
    if (existing.order.status === "CANCELLED") {
        throw new ApiError(400, "Cannot modify items on a cancelled order");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.orderItem.update({
            where: { id },
            data: { status: validation.data.status },
        });

        // Fetch fresh item statuses for rollup
        const siblings = await tx.orderItem.findMany({
            where: { orderId: existing.order.id },
            select: { status: true },
        });

        const nextOrderStatus = rollOrderStatus(existing.order.status, siblings);
        if (nextOrderStatus) {
            await tx.order.update({
                where: { id: existing.order.id },
                data: { status: nextOrderStatus as any },
            });
        }

        return tx.order.findUnique({
            where: { id: existing.order.id },
            include: ORDER_INCLUDES,
        });
    });

    if (updatedOrder) {
        orderEvents.emit(`orders:${shopId}`, { type: "updated", order: updatedOrder });
    }

    return res.status(200).json({
        success: true,
        message: "Item status updated",
        data: { order: updatedOrder },
    });
};
