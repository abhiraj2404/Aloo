import type { DiscountType } from "@repo/types";

export type ComputeChargesInput = {
    subtotal: number;                          // paise
    discountType?: DiscountType | null;
    discountValue?: number;                    // bp if PERCENT, paise if FLAT
    cgstRateBp: number;                        // basis points (0-10000)
    sgstRateBp: number;
    serviceChargeRateBp: number;
};

export type ComputeChargesOutput = {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    preRoundTotal: number;
    roundOff: number;
    totalAmount: number;
};

const clampNonNegative = (n: number) => Math.max(0, n);

const computeDiscountAmount = (
    subtotal: number,
    type: DiscountType | null | undefined,
    value: number | undefined,
): number => {
    if (!type || !value) return 0;
    const raw = type === "PERCENT"
        ? Math.floor((subtotal * value) / 10000)  // bp / 10000
        : value;
    return Math.min(clampNonNegative(raw), subtotal);
};

// Round preRound (paise) to nearest whole rupee. Returns adjustment in paise (can be negative).
const computeRoundOff = (preRound: number) => Math.round(preRound / 100) * 100 - preRound;

export const computeCharges = (input: ComputeChargesInput): ComputeChargesOutput => {
    const subtotal = clampNonNegative(input.subtotal);
    const discountAmount = computeDiscountAmount(subtotal, input.discountType, input.discountValue);
    const taxableAmount = clampNonNegative(subtotal - discountAmount);

    const cgstAmount = Math.floor((taxableAmount * input.cgstRateBp) / 10000);
    const sgstAmount = Math.floor((taxableAmount * input.sgstRateBp) / 10000);
    const serviceChargeAmount = Math.floor((taxableAmount * input.serviceChargeRateBp) / 10000);

    const preRoundTotal = taxableAmount + cgstAmount + sgstAmount + serviceChargeAmount;
    const roundOff = computeRoundOff(preRoundTotal);
    const totalAmount = preRoundTotal + roundOff;

    return {
        subtotal,
        discountAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        serviceChargeAmount,
        preRoundTotal,
        roundOff,
        totalAmount,
    };
};
