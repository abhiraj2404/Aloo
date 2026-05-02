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

export const CreateOrderSchema = OrderSchema.omit({id: true, tableSessionId: true, status: true, totalAmount: true, orderItems: true, orderType: true}).extend({
    tableNumber: z.number().optional(), // required only for DINE_IN
    orderType: OrderTypeEnum.default("DINE_IN"),
    items: z.array(OrderItemSchema.pick({ itemId: true, quantity: true })).nonempty("Order must have at least one item"),
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