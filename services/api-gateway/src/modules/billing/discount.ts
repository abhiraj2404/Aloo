import type { DiscountType } from "@repo/database";
import { ApiError } from "../../utils/ApiError";
import { computeCharges } from "./compute";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";
import { BILL_INCLUDE } from "./generate";

type ApplyDiscountParams = {
    shopId: string;
    billId: string;
    userId?: string | null;
    discount: { type: DiscountType; value: number } | null;
};

const recomputeBill = async (db: DbClient, billId: string, discount: ApplyDiscountParams["discount"]) => {
    const bill = await db.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.status === "CANCELLED") throw new ApiError(400, "Cannot modify a cancelled bill");
    if (bill.status === "PAID") throw new ApiError(400, "Cannot modify a paid bill");

    const shop = await db.shop.findUnique({ where: { id: bill.shopId } });
    if (!shop) throw new ApiError(404, "Shop not found");

    const charges = computeCharges({
        subtotal: bill.subtotal,
        discountType: discount?.type ?? null,
        discountValue: discount?.value ?? 0,
        cgstRateBp: shop.cgstRate,
        sgstRateBp: shop.sgstRate,
        serviceChargeRateBp: shop.serviceChargeRate,
    });

    if (charges.totalAmount < bill.paidAmount) {
        throw new ApiError(
            400,
            "Discount would make total less than amount already paid. Refund payments first.",
        );
    }

    return { bill, charges };
};

export const applyDiscount = async (db: DbClient, params: ApplyDiscountParams) => {
    const { billId, shopId, userId, discount } = params;
    const { bill, charges } = await recomputeBill(db, billId, discount);
    if (bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");

    const updated = await db.bill.update({
        where: { id: billId },
        data: {
            discountType: discount?.type ?? null,
            discountValue: discount?.value ?? 0,
            discountAmount: charges.discountAmount,
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
        action: discount ? "BILL_DISCOUNT_APPLIED" : "BILL_DISCOUNT_CLEARED",
        entity: "BILL",
        entityId: billId,
        metadata: discount
            ? { type: discount.type, value: discount.value, discountAmount: charges.discountAmount }
            : { cleared: true },
    });

    return updated;
};
