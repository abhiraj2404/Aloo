import z from "zod";

export const BillStatusEnum = z.enum(["GENERATED", "PARTIALLY_PAID", "PAID", "CANCELLED"]);
export type BillStatus = z.infer<typeof BillStatusEnum>;

export const DiscountTypeEnum = z.enum(["PERCENT", "FLAT"]);
export type DiscountType = z.infer<typeof DiscountTypeEnum>;

export const PaymentModeEnum = z.enum(["CASH", "CARD", "UPI", "WALLET", "OTHER"]);
export type PaymentMode = z.infer<typeof PaymentModeEnum>;

export const AuditActionEnum = z.enum([
    "BILL_GENERATED",
    "BILL_DISCOUNT_APPLIED",
    "BILL_DISCOUNT_CLEARED",
    "BILL_PAYMENT_RECORDED",
    "BILL_CANCELLED",
    "BILL_PRINTED",
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

export const PaymentSchema = z.object({
    id: z.cuid(),
    billId: z.cuid(),
    shopId: z.cuid(),
    mode: PaymentModeEnum,
    amount: z.int().nonnegative(),
    reference: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const BillSchema = z.object({
    id: z.cuid(),
    shopId: z.cuid(),
    tableSessionId: z.cuid(),
    billNumber: z.string(),
    subtotal: z.int().nonnegative(),
    discountType: DiscountTypeEnum.nullable().optional(),
    discountValue: z.int().nonnegative().default(0),
    discountAmount: z.int().nonnegative().default(0),
    cgstAmount: z.int().nonnegative().default(0),
    sgstAmount: z.int().nonnegative().default(0),
    serviceChargeAmount: z.int().nonnegative().default(0),
    roundOff: z.int().default(0),
    totalAmount: z.int(),
    paidAmount: z.int().nonnegative().default(0),
    status: BillStatusEnum.default("GENERATED"),
    cancelledReason: z.string().nullable().optional(),
});
export type Bill = z.infer<typeof BillSchema>;

// ── Input schemas ──────────────────────────────────────────────────────────

export const ApplyDiscountSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("PERCENT"), value: z.int().min(0).max(10000) }), // basis points
    z.object({ type: z.literal("FLAT"), value: z.int().min(0) }),                // paise
]);
export type ApplyDiscountInput = z.infer<typeof ApplyDiscountSchema>;

export const RecordPaymentSchema = z.object({
    mode: PaymentModeEnum,
    amount: z.int().positive(),
    reference: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const CancelBillSchema = z.object({
    reason: z.string().min(1).max(500),
});
export type CancelBillInput = z.infer<typeof CancelBillSchema>;
