import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z, { check, success } from "zod";
import { CreateOrderSchema } from "@repo/types";

export const getOrderById = async (req: Request<{id: string}>, res: Response) => {
    const orderId = req.params.id;
    if(!orderId) throw new ApiError(400, "OrderId is required");

    const order = await prisma.order.findUnique({where: {id: orderId}});
    if(!order) throw new ApiError(400, "Order not found");

    return res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        data: {order}
    })
}

export const getAllOrders= async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const orders = await prisma.order.findMany({where: {shopId}});

    return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: {orders}
    })
}

export const createOrder = async (req: Request, res: Response) => {
    const validation = z.safeParse(CreateOrderSchema, req.body);
    if(!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    // orderItems is array of itemIds and quantity 
    const { shopId, userId, tableNumber, items } = validation.data;

    // get table id
    const table = await prisma.table.findUnique({where: {shopId_tableNumber: {shopId, tableNumber}}});
    if(!table) throw new ApiError(400, "Table number does not exist");
    const tableId = table.id;

    // check if tableSession exists
    const activeTableSession = await prisma.tableSession.findFirst({
        where: {
            shopId,
            tableId,
            endedAt: null
        }
    });
    if(activeTableSession) throw new ApiError(400, "A session for this table already exists");

    // get item data 
    const itemIds = items.map( item => item.itemId );
    const menuItems = await prisma.item.findMany({
        where: {id: {in: itemIds}},
        select: {id:true, name:true, price:true}
    });

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    // calculate total amount 
    let totalAmount = 0;
    items.forEach((reqItem) => { 
        const menuItem = menuItemsById.get(reqItem.itemId);
        if(!menuItem) throw new ApiError(400, `Item with given id:${reqItem.itemId} does not exist`);
        totalAmount += (menuItem.price * reqItem.quantity);
    });

    // single db txn to create tableSession, order and orderItems
    const result = await prisma.$transaction(async (tx) => {
        // create table Session
        const tableSession = await tx.tableSession.create({ 
            data: {
                shopId,
                userId,
                tableId
            }
        });

        const createOrder = await tx.order.create({
            data: {
                shopId,
                userId,
                tableSessionId: tableSession.id,
                totalAmount,
                orderItems: {
                    create: items.map((reqItem) => {
                        const menuItem = menuItemsById.get(reqItem.itemId);
                        if(!menuItem) throw new ApiError(400, `Item with given id:${reqItem.itemId} does not exist`)
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

        return createOrder;
    });

    return res.status(200).json({
        success: "true",
        message: "Order created successfully",
        data: {order: result}
    })
}


export const updateOrder= async (req: Request, res: Response) => {
    
}
export const deleteOrder = async (req: Request, res: Response) => {

}