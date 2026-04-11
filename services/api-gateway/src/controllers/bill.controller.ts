import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z from "zod";
import { BillStatusEnum } from "@repo/types";

export const generateBill = async (req: Request<{tableSessionId: string}>, res: Response) => {
    const { tableSessionId } = req.params;
    if(!tableSessionId) throw new ApiError(400, "TableSessionId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const tableSession = await prisma.tableSession.findUnique({
        where: {id: tableSessionId},
        include: {table: true}
    });
    if(!tableSession) throw new ApiError(404, "Table session not found");
    if(tableSession.shopId !== shopId) throw new ApiError(403, "You do not have access to this table session");

    const existingBill = await prisma.bill.findUnique({where: {tableSessionId}});
    if(existingBill) throw new ApiError(400, "Bill already generated for this session");

    const orders = await prisma.order.findMany({
        where: {
            tableSessionId,
            status: {not: "CANCELLED"}
        },
        include: {orderItems: true}
    });

    if(orders.length === 0) throw new ApiError(400, "No billable orders found for this session");

    const subtotal = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalAmount = subtotal;

    const bill = await prisma.bill.create({
        data: {
            shopId,
            tableSessionId,
            subtotal,
            totalAmount,
        },
        include: {
            tableSession: {
                include: {table: true}
            }
        }
    });

    return res.status(201).json({
        success: true,
        message: "Bill generated successfully",
        data: {bill, orders}
    });
}

export const getBillById = async (req: Request<{id: string}>, res: Response) => {
    const { id } = req.params;
    if(!id) throw new ApiError(400, "BillId is required");

    const bill = await prisma.bill.findUnique({
        where: {id},
        include: {
            tableSession: {
                include: {
                    table: true,
                    orders: {
                        include: {orderItems: true}
                    }
                }
            }
        }
    });
    if(!bill) throw new ApiError(404, "Bill not found");

    return res.status(200).json({
        success: true,
        message: "Bill fetched successfully",
        data: {bill}
    });
}

export const getAllBills = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const bills = await prisma.bill.findMany({
        where: {shopId},
        include: {
            tableSession: {
                include: {
                    table: true,
                    orders: {
                        include: {orderItems: true}
                    }
                }
            }
        },
        orderBy: {createdAt: "desc"}
    });

    return res.status(200).json({
        success: true,
        message: "Bills fetched successfully",
        data: {bills}
    });
}

export const updateBillStatus = async (req: Request<{id: string}>, res: Response) => {
    const { id } = req.params;
    if(!id) throw new ApiError(400, "BillId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const { status } = req.body;
    if(!status) throw new ApiError(400, "Status is required");

    const statusValidation = z.safeParse(BillStatusEnum, status);
    if(!statusValidation.success) throw new ApiError(400, "Invalid status value");

    const bill = await prisma.bill.findUnique({where: {id}});
    if(!bill) throw new ApiError(404, "Bill not found");
    if(bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if(bill.status === "PAID") throw new ApiError(400, "Bill is already paid");
    if(bill.status === "CANCELLED") throw new ApiError(400, "Bill is already cancelled");

    const updatedBill = await prisma.$transaction(async (tx) => {
        const updated = await tx.bill.update({
            where: {id},
            data: {status: statusValidation.data}
        });

        if(statusValidation.data === "PAID") {
            await tx.tableSession.update({
                where: {id: bill.tableSessionId},
                data: {endedAt: new Date()}
            });
        }

        return updated;
    });

    return res.status(200).json({
        success: true,
        message: "Bill status updated successfully",
        data: {bill: updatedBill}
    });
}
