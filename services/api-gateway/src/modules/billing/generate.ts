import { ApiError } from "../../utils/ApiError";
import { computeCharges } from "./compute";
import { nextBillNumber } from "./numbering";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";

const BILL_INCLUDE = {
    payments: { orderBy: { createdAt: "asc" as const } },
    customer: { select: { id: true, phone: true, name: true } },
    tableSession: {
        include: {
            table: true,
            orders: { include: { orderItems: true } },
        },
    },
    // Split-bill linkage. billItems is the explicit set of OrderItems a split bill
    // owns; non-split bills leave this empty and the receipt falls back to the full
    // session items list (preserves legacy behavior).
    billItems: { select: { orderItemId: true } },
    parent: { select: { id: true, billNumber: true } },
    children: { select: { id: true, billNumber: true, status: true, totalAmount: true } },
} as const;

export const generateBillForSession = async (
    db: DbClient,
    params: { shopId: string; tableSessionId: string; userId?: string | null },
) => {
    const { shopId, tableSessionId, userId } = params;

    const session = await db.tableSession.findUnique({
        where: { id: tableSessionId },
        include: { table: true },
    });
    if (!session) throw new ApiError(404, "Table session not found");
    if (session.shopId !== shopId) throw new ApiError(403, "You do not have access to this table session");

    // The session's "main" bill is the parent. Children only exist after a split.
    const existing = await db.bill.findFirst({ where: { tableSessionId, parentBillId: null } });
    if (existing) throw new ApiError(400, "Bill already generated for this session");

    const orders = await db.order.findMany({
        where: { tableSessionId, status: { not: "CANCELLED" } },
        include: { orderItems: true },
    });
    if (orders.length === 0) throw new ApiError(400, "No billable orders found for this session");

    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new ApiError(404, "Shop not found");

    const subtotal = orders.reduce((s, o) => s + o.totalAmount, 0);
    const charges = computeCharges({
        subtotal,
        cgstRateBp: shop.cgstRate,
        sgstRateBp: shop.sgstRate,
        serviceChargeRateBp: shop.serviceChargeRate,
    });

    const billNumber = await nextBillNumber(db, shopId);

    const bill = await db.bill.create({
        data: {
            shopId,
            tableSessionId,
            customerId: session.customerId,
            billNumber,
            subtotal: charges.subtotal,
            cgstAmount: charges.cgstAmount,
            sgstAmount: charges.sgstAmount,
            serviceChargeAmount: charges.serviceChargeAmount,
            roundOff: charges.roundOff,
            totalAmount: charges.totalAmount,
        },
        include: BILL_INCLUDE,
    });

    await writeAudit(db, {
        shopId,
        userId,
        action: "BILL_GENERATED",
        entity: "BILL",
        entityId: bill.id,
        metadata: { billNumber, subtotal: charges.subtotal, totalAmount: charges.totalAmount },
    });

    return bill;
};

export { BILL_INCLUDE };
