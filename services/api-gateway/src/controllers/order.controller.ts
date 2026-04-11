import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z from "zod";
import { CreateOrderSchema, UpdateOrderItemsSchema, OrderStatusEnum } from "@repo/types";

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

    const orders = await prisma.order.findMany({
        where: {shopId},
        include: {
            orderItems: true,
            tableSession: {
                include: {table: true}
            }
        },
        orderBy: {createdAt: "desc"}
    });

    return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: {orders}
    });
}

export const createOrder = async (req: Request, res: Response) => {
    const validation = z.safeParse(CreateOrderSchema, req.body);
    if(!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const { shopId, userId, tableNumber, items } = validation.data;

    const table = await prisma.table.findUnique({where: {shopId_tableNumber: {shopId, tableNumber}}});
    if(!table) throw new ApiError(400, "Table number does not exist");
    const tableId = table.id;

    const itemIds = items.map(item => item.itemId);
    const menuItems = await prisma.item.findMany({
        where: {id: {in: itemIds}},
        select: {id: true, name: true, price: true}
    });

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    let totalAmount = 0;
    items.forEach((reqItem) => {
        const menuItem = menuItemsById.get(reqItem.itemId);
        if(!menuItem) throw new ApiError(400, `Item with given id:${reqItem.itemId} does not exist`);
        totalAmount += (menuItem.price * reqItem.quantity);
    });

    const result = await prisma.$transaction(async (tx) => {
        let tableSession = await tx.tableSession.findFirst({
            where: {
                shopId,
                tableId,
                endedAt: null
            }
        });

        if(!tableSession) {
            tableSession = await tx.tableSession.create({
                data: {
                    shopId,
                    userId,
                    tableId
                }
            });
        }

        const order = await tx.order.create({
            data: {
                shopId,
                userId,
                tableSessionId: tableSession.id,
                totalAmount,
                orderItems: {
                    create: items.map((reqItem) => {
                        const menuItem = menuItemsById.get(reqItem.itemId);
                        if(!menuItem) throw new ApiError(400, `Item with given id:${reqItem.itemId} does not exist`);
                        return {
                            itemId: menuItem.id,
                            name: menuItem.name,
                            price: menuItem.price,
                            quantity: reqItem.quantity
                        }
                    })
                }
            },
            include: {
                orderItems: true,
                tableSession: true
            }
        });

        return order;
    });

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

    const itemIds = items.map(item => item.itemId);
    const menuItems = await prisma.item.findMany({
        where: {id: {in: itemIds}},
        select: {id: true, name: true, price: true}
    });

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    let totalAmount = 0;
    items.forEach((reqItem) => {
        const menuItem = menuItemsById.get(reqItem.itemId);
        if(!menuItem) throw new ApiError(400, `Item with id:${reqItem.itemId} does not exist`);
        totalAmount += (menuItem.price * reqItem.quantity);
    });

    const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({where: {orderId}});

        return tx.order.update({
            where: {id: orderId},
            data: {
                totalAmount,
                orderItems: {
                    create: items.map((reqItem) => {
                        const menuItem = menuItemsById.get(reqItem.itemId)!;
                        return {
                            itemId: menuItem.id,
                            name: menuItem.name,
                            price: menuItem.price,
                            quantity: reqItem.quantity
                        };
                    })
                }
            },
            include: {orderItems: true}
        });
    });

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
        include: {orderItems: true}
    });

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

    return res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    });
}