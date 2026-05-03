import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma, type Table } from "@repo/database";
import * as z from 'zod';

const CreateTableSchema = z.object({
    shopId: z.cuid(),
    tableNumber: z.number().int().positive()
})

const UpdateTableSchema = z.object({
    tableNumber: z.number().int().positive(),
});

export const createTable=async(req: Request, res: Response)=>{
    const { shopId, tableNumber } = CreateTableSchema.parse(req.body);

    const shop = await prisma.shop.findUnique({where: {id: shopId}});
    if(!shop) throw new ApiError(400, "Shop does not exist");

    const tablecheck = await prisma.table.findUnique({where: {
        shopId_tableNumber: {
            shopId,
            tableNumber
        }
    }});
    if(tablecheck) throw new ApiError(400, `Table with tableNumber ${tableNumber} already exists.`);

    const table: Table = await prisma.table.create({
        data: {
            shopId,
            tableNumber
        }
    });

    res.status(201).json({ success: true, message: 'Table created successfully', data: {table} });
}

export const getAllTables=async(req: Request<{shopId: string}>, res: Response)=>{
    const {shopId} = req.params;
    if(!shopId) throw new ApiError(400,"shopId is required!");

    const shop = await prisma.shop.findUnique({where: {id: shopId}});
    if(!shop) throw new ApiError(400,"Shop does not exist");

    const tables = await prisma.table.findMany({
        where: {shopId: shopId, deletedAt: null},
        orderBy: { tableNumber: "asc" },
        include: {
            sessions: {
                where: {endedAt: null},
                select: {id: true},
                take: 1
            }
        }
    });

    res.status(200).json({ success: true, message: `Tables for shopId: ${shopId} fetched successfully.` , data: {tables} });
}

export const updateTable = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Table id is required");

    const { tableNumber } = UpdateTableSchema.parse(req.body);

    const userShopId = req.user?.shopMembership?.shopId;
    if (!userShopId) throw new ApiError(400, "User is not related to a shop");

    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Table not found");
    if (existing.shopId !== userShopId) throw new ApiError(403, "You do not have access to this table");

    if (existing.tableNumber === tableNumber) {
        return res.status(200).json({ success: true, message: "Table updated successfully", data: { table: existing } });
    }

    const clash = await prisma.table.findUnique({
        where: { shopId_tableNumber: { shopId: existing.shopId, tableNumber } },
    });
    if (clash && !clash.deletedAt) throw new ApiError(400, `Table number ${tableNumber} is already in use.`);

    const table = await prisma.table.update({
        where: { id },
        data: { tableNumber },
    });

    res.status(200).json({ success: true, message: "Table updated successfully", data: { table } });
};

export const deleteTable = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Table id is required");

    const userShopId = req.user?.shopMembership?.shopId;
    if (!userShopId) throw new ApiError(400, "User is not related to a shop");

    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Table not found");
    if (existing.shopId !== userShopId) throw new ApiError(403, "You do not have access to this table");

    const activeSession = await prisma.tableSession.findFirst({
        where: { tableId: id, endedAt: null },
        select: { id: true },
    });
    if (activeSession) throw new ApiError(400, "Cannot delete a table with an active session — close the session first");

    await prisma.table.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    res.status(200).json({ success: true, message: "Table deleted successfully" });
};
