import { ApiError } from "../../utils/ApiError";
import { computeCharges } from "./compute";
import { nextBillNumber } from "./numbering";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";
import { BILL_INCLUDE } from "./generate";

type SplitParams = {
    shopId: string;
    parentBillId: string;
    orderItemIds: string[];
    userId?: string | null;
};

// POST /bill/:id/split
// Moves the chosen OrderItems off the parent bill into a fresh child bill.
// Both sides recompute their charges from scratch using the shop's current
// tax/service rates. Discounts on the parent are not propagated — clear them
// before splitting (caught at validation time).
export const splitBill = async (db: DbClient, params: SplitParams) => {
    const { shopId, parentBillId, orderItemIds, userId } = params;

    if (orderItemIds.length === 0) {
        throw new ApiError(400, "Select at least one item to split off");
    }
    if (new Set(orderItemIds).size !== orderItemIds.length) {
        throw new ApiError(400, "Duplicate item ids in split selection");
    }

    const parent = await db.bill.findUnique({
        where: { id: parentBillId },
        include: {
            tableSession: { include: { orders: { include: { orderItems: true } } } },
            billItems: true,
        },
    });
    if (!parent) throw new ApiError(404, "Bill not found");
    if (parent.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if (parent.parentBillId) throw new ApiError(400, "Cannot split a child bill");
    if (parent.status === "PAID") throw new ApiError(400, "Bill is already paid");
    if (parent.status === "CANCELLED") throw new ApiError(400, "Bill is cancelled");
    if (parent.paidAmount > 0) {
        throw new ApiError(400, "Bill has recorded payments — refund them before splitting");
    }
    if (parent.discountAmount > 0) {
        throw new ApiError(400, "Clear the bill discount before splitting");
    }

    // Build the canonical set of session items
    const sessionItems = parent.tableSession.orders.flatMap((o) => o.orderItems);
    const sessionItemIds = new Set(sessionItems.map((i) => i.id));
    for (const id of orderItemIds) {
        if (!sessionItemIds.has(id)) {
            throw new ApiError(400, `Order item ${id} does not belong to this bill's session`);
        }
    }

    // If the parent already has billItems (was split before), the "owned" items
    // for the parent are those rows. Otherwise the parent owns all session items.
    const parentOwnedIds = parent.billItems.length > 0
        ? new Set(parent.billItems.map((bi) => bi.orderItemId))
        : new Set(sessionItems.map((i) => i.id));

    for (const id of orderItemIds) {
        if (!parentOwnedIds.has(id)) {
            throw new ApiError(400, "One or more items are already on another split — refresh and try again");
        }
    }

    // Don't allow splitting EVERY item off (parent would be left empty)
    if (orderItemIds.length >= parentOwnedIds.size) {
        throw new ApiError(400, "Cannot split off every item — at least one must remain on the original bill");
    }

    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new ApiError(404, "Shop not found");

    const movedItems = sessionItems.filter((i) => orderItemIds.includes(i.id));
    const remainingItemIds = Array.from(parentOwnedIds).filter((id) => !orderItemIds.includes(id));
    const remainingItems = sessionItems.filter((i) => remainingItemIds.includes(i.id));

    const childSubtotal = movedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const parentSubtotal = remainingItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const childCharges = computeCharges({
        subtotal: childSubtotal,
        cgstRateBp: shop.cgstRate,
        sgstRateBp: shop.sgstRate,
        serviceChargeRateBp: shop.serviceChargeRate,
    });
    const parentCharges = computeCharges({
        subtotal: parentSubtotal,
        cgstRateBp: shop.cgstRate,
        sgstRateBp: shop.sgstRate,
        serviceChargeRateBp: shop.serviceChargeRate,
    });

    const childBillNumber = await nextBillNumber(db, shopId);

    const child = await db.bill.create({
        data: {
            shopId,
            tableSessionId: parent.tableSessionId,
            customerId: parent.customerId,
            parentBillId: parent.id,
            billNumber: childBillNumber,
            subtotal: childCharges.subtotal,
            cgstAmount: childCharges.cgstAmount,
            sgstAmount: childCharges.sgstAmount,
            serviceChargeAmount: childCharges.serviceChargeAmount,
            roundOff: childCharges.roundOff,
            totalAmount: childCharges.totalAmount,
            billItems: {
                create: orderItemIds.map((orderItemId) => ({ orderItemId })),
            },
        },
        include: BILL_INCLUDE,
    });

    // If the parent had no explicit billItems before this split, materialize them
    // for its remaining items so future splits / receipts know what it owns.
    if (parent.billItems.length === 0) {
        await db.billItem.createMany({
            data: remainingItemIds.map((orderItemId) => ({ billId: parent.id, orderItemId })),
        });
    }

    const updatedParent = await db.bill.update({
        where: { id: parent.id },
        data: {
            subtotal: parentCharges.subtotal,
            cgstAmount: parentCharges.cgstAmount,
            sgstAmount: parentCharges.sgstAmount,
            serviceChargeAmount: parentCharges.serviceChargeAmount,
            roundOff: parentCharges.roundOff,
            totalAmount: parentCharges.totalAmount,
        },
        include: BILL_INCLUDE,
    });

    await writeAudit(db, {
        shopId,
        userId,
        action: "BILL_SPLIT",
        entity: "BILL",
        entityId: parent.id,
        metadata: {
            childBillId: child.id,
            childBillNumber,
            movedItemCount: orderItemIds.length,
            childTotal: child.totalAmount,
            parentTotal: updatedParent.totalAmount,
        },
    });

    return { parent: updatedParent, child };
};
