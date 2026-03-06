import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z from "zod";
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

    const { shopId, tableSessionId, userId } = validation.data;
}
export const updateOrder= async (req: Request, res: Response) => {

}
export const deleteOrder = async (req: Request, res: Response) => {

}