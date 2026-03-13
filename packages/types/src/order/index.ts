import z from "zod";

export const OrderStatusEnum = z.enum(["PENDING", "PAID", "CANCELLED"]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

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
    tableSessionId: z.cuid(), // TODO: can be optional in future for online orders
    userId: z.cuid().optional(), // can be optional, what if order is created by a GUEST USER
    totalAmount: z.int(),
    status: OrderStatusEnum.default("PENDING"),
    orderItems: z.array(OrderItemSchema)
})

export const CreateOrderSchema = OrderSchema.omit({id: true, tableSessionId: true, status: true, totalAmount: true, orderItems: true}).extend({
    tableNumber: z.number(),
    items: z.array(OrderItemSchema.pick({ itemId: true, quantity: true })).nonempty("Order must have at least one item"),
});
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;