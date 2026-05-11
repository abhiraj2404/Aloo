import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z from "zod";
import { CreateOrderSchema, UpdateOrderItemsSchema, OrderStatusEnum, type CreateOrderItem } from "@repo/types";
import { EventEmitter } from "events";
import { createInitialKot, rebuildKot } from "../modules/kitchen/kot";

export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(200);

type OrderEvent =
    | { type: "created"; order: any }
    | { type: "updated"; order: any }
    | { type: "deleted"; orderId: string };

const ORDER_INCLUDES = {
    orderItems: true,
    tableSession: { include: { table: true } },
    customer: { select: { id: true, phone: true, name: true } },
    kot: { select: { id: true, kotNumber: true, isSupplementary: true, printedAt: true } },
} as const;

const buildOrdersQuery = (shopId: string) => ({
    where: {
        shopId,
        OR: [
            { tableSession: { bill: null } },
            { tableSessionId: null },
        ],
    },
    include: ORDER_INCLUDES,
    orderBy: { createdAt: "desc" as const },
});

// Resolves a list of cart-line selections (CreateOrderItem) into rows ready to
// insert into OrderItem — with name/price snapshotted from the live menu so
// past orders stay frozen even when the menu changes later.
type ResolvedLine = {
    itemId: string;
    name: string;
    price: number;          // unit price = (variant or item) + addon prices
    quantity: number;
    variantId: string | null;
    variantName: string | null;
    addons: { name: string; price: number }[];
};

const resolveOrderLines = async (
    items: CreateOrderItem[],
    shopId: string,
): Promise<{ lines: ResolvedLine[]; subtotal: number }> => {
    const itemIds = Array.from(new Set(items.map((i) => i.itemId)));
    const variantIds = Array.from(new Set(items.map((i) => i.variantId).filter((x): x is string => !!x)));
    const addonIds = Array.from(new Set(items.flatMap((i) => i.addonIds ?? [])));

    const [menuItems, variants, addons] = await Promise.all([
        prisma.item.findMany({
            where: { id: { in: itemIds }, shopId, deletedAt: null },
            select: { id: true, name: true, price: true, addonGroups: { select: { addonGroupId: true } } },
        }),
        variantIds.length
            ? prisma.itemVariant.findMany({
                where: { id: { in: variantIds }, deletedAt: null },
                select: { id: true, itemId: true, name: true, price: true },
            })
            : Promise.resolve([] as { id: string; itemId: string; name: string; price: number }[]),
        addonIds.length
            ? prisma.addon.findMany({
                where: { id: { in: addonIds }, deletedAt: null, addonGroup: { shopId, deletedAt: null } },
                select: { id: true, name: true, price: true, addonGroupId: true },
            })
            : Promise.resolve([] as { id: string; name: string; price: number; addonGroupId: string }[]),
    ]);

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const addonMap = new Map(addons.map((a) => [a.id, a]));

    const lines: ResolvedLine[] = [];
    let subtotal = 0;

    for (const line of items) {
        const item = itemMap.get(line.itemId);
        if (!item) throw new ApiError(400, `Item with id ${line.itemId} does not exist in this shop`);

        let unitPrice = item.price;
        let variantId: string | null = null;
        let variantName: string | null = null;

        if (line.variantId) {
            const variant = variantMap.get(line.variantId);
            if (!variant) throw new ApiError(400, `Variant ${line.variantId} not found`);
            if (variant.itemId !== line.itemId) throw new ApiError(400, `Variant ${line.variantId} does not belong to item ${line.itemId}`);
            unitPrice = variant.price;
            variantId = variant.id;
            variantName = variant.name;
        }

        const lineAddons: { name: string; price: number }[] = [];
        if (line.addonIds && line.addonIds.length) {
            const allowedGroupIds = new Set(item.addonGroups.map((g) => g.addonGroupId));
            for (const addonId of line.addonIds) {
                const addon = addonMap.get(addonId);
                if (!addon) throw new ApiError(400, `Addon ${addonId} not found`);
                if (!allowedGroupIds.has(addon.addonGroupId)) {
                    throw new ApiError(400, `Addon ${addon.name} is not allowed on item ${item.name}`);
                }
                unitPrice += addon.price;
                lineAddons.push({ name: addon.name, price: addon.price });
            }
        }

        lines.push({
            itemId: item.id,
            name: item.name,
            price: unitPrice,
            quantity: line.quantity,
            variantId,
            variantName,
            addons: lineAddons,
        });
        subtotal += unitPrice * line.quantity;
    }

    return { lines, subtotal };
};

export const getOrderById = async (req: Request<{id: string}>, res: Response) => {
    const orderId = req.params.id;
    if(!orderId) throw new ApiError(400, "OrderId is required");

    const order = await prisma.order.findUnique({
        where: {id: orderId},
        include: {orderItems: true}
    });
    if(!order) throw new ApiError(404, "Order not found");

    return res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        data: {order}
    });
}

export const getAllOrders = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const orders = await prisma.order.findMany(buildOrdersQuery(shopId));

    return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: {orders}
    });
}

export const streamOrders = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send full snapshot on initial connection
    const orders = await prisma.order.findMany(buildOrdersQuery(shopId));
    res.write(`event: snapshot\ndata: ${JSON.stringify(orders)}\n\n`);

    const forwardEvent = (event: OrderEvent) => {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.type === "deleted" ? { orderId: event.orderId } : { order: event.order })}\n\n`);
    };

    const eventKey = `orders:${shopId}`;
    orderEvents.on(eventKey, forwardEvent);

    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 30000);

    req.on("close", () => {
        orderEvents.off(eventKey, forwardEvent);
        clearInterval(heartbeat);
    });
}

export const createOrder = async (req: Request, res: Response) => {
    const validation = z.safeParse(CreateOrderSchema, req.body);
    if(!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const { shopId, userId, tableNumber, orderType, items, customerPhone, customerName } = validation.data;

    let tableId: string | null = null;
    if (orderType === "DINE_IN") {
        const table = await prisma.table.findUnique({where: {shopId_tableNumber: {shopId, tableNumber: tableNumber!}}});
        if(!table) throw new ApiError(400, "Table number does not exist");
        tableId = table.id;
    }

    const { lines, subtotal } = await resolveOrderLines(items, shopId);

    const result = await prisma.$transaction(async (tx) => {
        // Upsert customer (phone is the identity per shop)
        let customerId: string | null = null;
        if (customerPhone) {
            const customer = await tx.customer.upsert({
                where: { shopId_phone: { shopId, phone: customerPhone } },
                update: {
                    visits: { increment: 1 },
                    ...(customerName ? { name: customerName } : {}),
                },
                create: {
                    shopId,
                    phone: customerPhone,
                    name: customerName ?? null,
                    visits: 1,
                },
            });
            customerId = customer.id;
        }

        let tableSession = tableId
            ? await tx.tableSession.findFirst({
                where: { shopId, tableId, endedAt: null },
            })
            : null;

        if (tableId && !tableSession) {
            tableSession = await tx.tableSession.create({
                data: {
                    shopId,
                    userId,
                    tableId,
                    customerId,
                },
            });
        } else if (tableSession && customerId && !tableSession.customerId) {
            // Backfill customer onto an existing anonymous session
            tableSession = await tx.tableSession.update({
                where: { id: tableSession.id },
                data: { customerId },
            });
        }

        const order = await tx.order.create({
            data: {
                shopId,
                userId,
                customerId,
                tableSessionId: tableSession?.id ?? null,
                totalAmount: subtotal,
                orderType,
                orderItems: {
                    create: lines.map((l) => ({
                        itemId: l.itemId,
                        name: l.name,
                        price: l.price,
                        quantity: l.quantity,
                        variantId: l.variantId,
                        variantName: l.variantName,
                        addons: l.addons.length ? l.addons : undefined,
                    })),
                },
            },
            include: ORDER_INCLUDES,
        });

        await createInitialKot(tx, {
            shopId,
            orderId: order.id,
            tableSessionId: order.tableSessionId,
            orderItems: order.orderItems,
        });

        return tx.order.findUnique({
            where: { id: order.id },
            include: ORDER_INCLUDES,
        });
    });

    orderEvents.emit(`orders:${shopId}`, { type: "created", order: result } satisfies OrderEvent);

    return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {order: result}
    });
}

export const updateOrderItems = async (req: Request<{id: string}>, res: Response) => {
    const orderId = req.params.id;
    if(!orderId) throw new ApiError(400, "OrderId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not a staff member of the shop");

    const validation = z.safeParse(UpdateOrderItemsSchema, req.body);
    if(!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const { items } = validation.data;

    const order = await prisma.order.findUnique({where: {id: orderId}});
    if(!order) throw new ApiError(404, "Order not found");
    if(order.shopId !== shopId) throw new ApiError(403, "You do not have access to this order");
    if(order.status !== "PENDING" && order.status !== "CONFIRMED") {
        throw new ApiError(400, "Can only update items on PENDING or CONFIRMED orders");
    }

    const { lines, subtotal } = await resolveOrderLines(items, shopId);

    const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({where: {orderId}});

        const updated = await tx.order.update({
            where: {id: orderId},
            data: {
                totalAmount: subtotal,
                orderItems: {
                    create: lines.map((l) => ({
                        itemId: l.itemId,
                        name: l.name,
                        price: l.price,
                        quantity: l.quantity,
                        variantId: l.variantId,
                        variantName: l.variantName,
                        addons: l.addons.length ? l.addons : undefined,
                    })),
                },
            },
            include: ORDER_INCLUDES,
        });

        // Edit happened before kitchen made the items — refresh the KOT in place
        // so the kitchen sees the new list with the same kotNumber.
        const existingKot = await tx.kot.findUnique({ where: { orderId } });
        if (existingKot) {
            await rebuildKot(tx, { orderId, orderItems: updated.orderItems });
        } else {
            await createInitialKot(tx, {
                shopId: updated.shopId,
                orderId,
                tableSessionId: updated.tableSessionId,
                orderItems: updated.orderItems,
            });
        }

        return tx.order.findUnique({
            where: { id: orderId },
            include: ORDER_INCLUDES,
        });
    });

    orderEvents.emit(`orders:${shopId}`, { type: "updated", order: updatedOrder } satisfies OrderEvent);

    return res.status(200).json({
        success: true,
        message: "Order items updated successfully",
        data: {order: updatedOrder}
    });
}

export const updateOrderStatus = async (req: Request<{id: string}>, res: Response) => {
    const orderId = req.params.id;
    if(!orderId) throw new ApiError(400, "OrderId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const { status } = req.body;
    if(!status) throw new ApiError(400, "Status is required");

    const statusValidation = z.safeParse(OrderStatusEnum, status);
    if(!statusValidation.success) throw new ApiError(400, "Invalid status value");

    const order = await prisma.order.findUnique({where: {id: orderId}});
    if(!order) throw new ApiError(404, "Order not found");
    if(order.shopId !== shopId) throw new ApiError(403, "You do not have access to this order");
    if(order.status === "CANCELLED") throw new ApiError(400, "Cannot update a cancelled order");
    if(order.status === "COMPLETED") throw new ApiError(400, "Cannot update a completed order");

    const updatedOrder = await prisma.order.update({
        where: {id: orderId},
        data: {status: statusValidation.data},
        include: { orderItems: true, tableSession: { include: { table: true } } }
    });

    orderEvents.emit(`orders:${shopId}`, { type: "updated", order: updatedOrder } satisfies OrderEvent);

    return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: {order: updatedOrder}
    });
}

export const deleteOrder = async (req: Request<{id: string}>, res: Response) => {
    const orderId = req.params.id;
    if(!orderId) throw new ApiError(400, "OrderId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const order = await prisma.order.findUnique({where: {id: orderId}});
    if(!order) throw new ApiError(404, "Order not found");
    if(order.shopId !== shopId) throw new ApiError(403, "You do not have access to this order");
    if(order.status !== "PENDING") throw new ApiError(400, "Only pending orders can be deleted");

    await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({where: {orderId}});
        await tx.order.delete({where: {id: orderId}});
    });

    orderEvents.emit(`orders:${shopId}`, { type: "deleted", orderId } satisfies OrderEvent);

    return res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    });
}
