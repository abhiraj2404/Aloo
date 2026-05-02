import type { PaymentMode } from "@repo/database";
import { ApiError } from "../../utils/ApiError";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";
import { BILL_INCLUDE } from "./generate";

type RecordPaymentParams = {
    shopId: string;
    billId: string;
    userId?: string | null;
    mode: PaymentMode;
    amount: number;       // paise
    reference?: string;
    notes?: string;
};

export const recordPayment = async (db: DbClient, params: RecordPaymentParams) => {
    const { shopId, billId, userId, mode, amount, reference, notes } = params;

    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if (bill.status === "CANCELLED") throw new ApiError(400, "Cannot record payment on a cancelled bill");
    if (bill.status === "PAID") throw new ApiError(400, "Bill is already fully paid");

    const newPaidAmount = bill.paidAmount + amount;
    if (newPaidAmount > bill.totalAmount) {
        throw new ApiError(
            400,
            `Payment of ₹${(amount / 100).toFixed(2)} would exceed the remaining balance of ₹${((bill.totalAmount - bill.paidAmount) / 100).toFixed(2)}`,
        );
    }

    const payment = await db.payment.create({
        data: {
            billId,
            shopId,
            mode,
            amount,
            reference: reference ?? null,
            notes: notes ?? null,
        },
    });

    const isFullyPaid = newPaidAmount >= bill.totalAmount;
    const newStatus = isFullyPaid ? "PAID" : "PARTIALLY_PAID";

    const updated = await db.bill.update({
        where: { id: billId },
        data: {
            paidAmount: newPaidAmount,
            status: newStatus,
        },
        include: BILL_INCLUDE,
    });

    // End table session when bill is fully paid
    if (isFullyPaid) {
        await db.tableSession.update({
            where: { id: bill.tableSessionId },
            data: { endedAt: new Date() },
        });
    }

    await writeAudit(db, {
        shopId,
        userId,
        action: "BILL_PAYMENT_RECORDED",
        entity: "BILL",
        entityId: billId,
        metadata: {
            paymentId: payment.id,
            mode,
            amount,
            reference,
            newPaidAmount,
            newStatus,
        },
    });

    return updated;
};
