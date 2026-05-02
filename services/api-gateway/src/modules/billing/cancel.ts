import { ApiError } from "../../utils/ApiError";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";
import { BILL_INCLUDE } from "./generate";

type CancelBillParams = {
    shopId: string;
    billId: string;
    userId?: string | null;
    reason: string;
};

export const cancelBill = async (db: DbClient, params: CancelBillParams) => {
    const { shopId, billId, userId, reason } = params;

    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if (bill.status === "PAID") throw new ApiError(400, "Cannot cancel a fully paid bill");
    if (bill.status === "CANCELLED") throw new ApiError(400, "Bill is already cancelled");

    // Allowed: GENERATED, PARTIALLY_PAID
    const updated = await db.bill.update({
        where: { id: billId },
        data: {
            status: "CANCELLED",
            cancelledReason: reason,
        },
        include: BILL_INCLUDE,
    });

    await writeAudit(db, {
        shopId,
        userId,
        action: "BILL_CANCELLED",
        entity: "BILL",
        entityId: billId,
        metadata: {
            reason,
            previousStatus: bill.status,
            paidAmount: bill.paidAmount,
        },
    });

    // NOTE: Table session is NOT ended on cancel — they may want to regenerate a bill

    return updated;
};
