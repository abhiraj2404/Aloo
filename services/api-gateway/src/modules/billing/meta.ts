import { ApiError } from "../../utils/ApiError";
import { computeCharges } from "./compute";
import type { DbClient } from "./numbering";
import { BILL_INCLUDE } from "./generate";

type UpdateMetaParams = {
    shopId: string;
    billId: string;
    userId?: string | null;
    // `undefined` = leave unchanged. `null` clears notes.
    tipAmount?: number;
    notes?: string | null;
};

// Lightweight bill update for tip + notes. Tip recomputes totalAmount; notes is text only.
// Kept separate from discount/payment paths so the controller surface stays explicit.
export const updateBillMeta = async (db: DbClient, params: UpdateMetaParams) => {
    const { shopId, billId, userId, tipAmount, notes } = params;

    if (tipAmount === undefined && notes === undefined) {
        throw new ApiError(400, "Nothing to update");
    }

    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if (bill.status === "CANCELLED") throw new ApiError(400, "Bill is cancelled");
    if (bill.status === "PAID") throw new ApiError(400, "Bill is fully paid");

    const data: { tipAmount?: number; totalAmount?: number; notes?: string | null } = {};

    if (tipAmount !== undefined) {
        if (!Number.isInteger(tipAmount) || tipAmount < 0) {
            throw new ApiError(400, "Tip must be a non-negative integer (paise)");
        }
        const shop = await db.shop.findUnique({ where: { id: bill.shopId } });
        if (!shop) throw new ApiError(404, "Shop not found");

        const charges = computeCharges({
            subtotal: bill.subtotal,
            discountType: bill.discountType,
            discountValue: bill.discountValue,
            cgstRateBp: shop.cgstRate,
            sgstRateBp: shop.sgstRate,
            serviceChargeRateBp: shop.serviceChargeRate,
            tipAmount,
        });

        if (charges.totalAmount < bill.paidAmount) {
            throw new ApiError(
                400,
                "New total would drop below amount already paid. Refund payments first.",
            );
        }

        data.tipAmount = tipAmount;
        data.totalAmount = charges.totalAmount;
    }

    if (notes !== undefined) {
        if (notes !== null && (typeof notes !== "string" || notes.length > 500)) {
            throw new ApiError(400, "Notes must be a string of at most 500 characters");
        }
        data.notes = notes;
    }

    const updated = await db.bill.update({
        where: { id: billId },
        data,
        include: BILL_INCLUDE,
    });

    // Intentionally no audit row — tip/notes are low-stakes cashier edits.
    void userId;
    return updated;
};
