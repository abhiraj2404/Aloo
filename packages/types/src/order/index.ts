import z from "zod";

export const OrderStatusEnum = z.enum(["PENDING", "CONFIRMED", "PREPARING", "COMPLETED", "CANCELLED"]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderTypeEnum = z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]);
export type OrderType = z.infer<typeof OrderTypeEnum>;

export const OrderItemSchema = z.object({
    id: z.cuid(),
    orderId: z.cuid(),
    itemId: z.cuid(),
    name: z.string(),
    price: z.int().nonnegative(),
    quantity: z.int().nonnegative(),
})

export const OrderSchema = z.object({
    id: z.cuid(),
    shopId: z.cuid(),
    tableSessionId: z.cuid().optional(), // optional for TAKEAWAY/DELIVERY
    userId: z.cuid().optional(), // can be optional, what if order is created by a GUEST USER
    totalAmount: z.int(),
    status: OrderStatusEnum.default("PENDING"),
    orderType: OrderTypeEnum.default("DINE_IN"),
    orderItems: z.array(OrderItemSchema)
})

// E.164: + then 8-15 digits, e.g. "+919876543210"
export const PhoneE164Schema = z.string().regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format (e.g. +919876543210)");

export const CreateOrderSchema = OrderSchema.omit({id: true, tableSessionId: true, status: true, totalAmount: true, orderItems: true, orderType: true}).extend({
    tableNumber: z.number().optional(), // required only for DINE_IN
    orderType: OrderTypeEnum.default("DINE_IN"),
    items: z.array(OrderItemSchema.pick({ itemId: true, quantity: true })).nonempty("Order must have at least one item"),
    // customer (captured at place-order time on storefront)
    customerPhone: PhoneE164Schema.optional(),
    customerName: z.string().min(1).max(80).optional(),
}).refine(d => d.orderType !== "DINE_IN" || d.tableNumber !== undefined, {
    message: "tableNumber is required for DINE_IN orders",
    path: ["tableNumber"],
});
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderItemsSchema = z.object({
    items: z.array(OrderItemSchema.pick({ itemId: true, quantity: true })).nonempty("Order must have at least one item"),
});
export type UpdateOrderItems = z.infer<typeof UpdateOrderItemsSchema>;

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;