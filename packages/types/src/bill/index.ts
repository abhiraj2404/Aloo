import z from "zod";

export const BillStatusEnum = z.enum(["GENERATED", "PAID", "CANCELLED"]);
export type BillStatus = z.infer<typeof BillStatusEnum>;

export const BillSchema = z.object({
    id: z.cuid(),
    shopId: z.cuid(),
    tableSessionId: z.cuid(),
    subtotal: z.int().nonnegative(),
    tax: z.int().nonnegative(),
    discount: z.int().nonnegative(),
    totalAmount: z.int(),
    status: BillStatusEnum.default("GENERATED"),
});

export type Bill = z.infer<typeof BillSchema>;
