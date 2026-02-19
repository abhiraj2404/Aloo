import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { prisma, type Table } from "@repo/database";
import * as z from 'zod';

const CreateTableSchema = z.object({
    shopId: z.cuid(),
    tableNumber: z.number().int().positive()
})

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

export const createQR = async(req: Request, res: Response)=>{
    const {tableId} = req.body;

    const table = await prisma.table.findUnique({where: {id: tableId}});
    if(!table) throw new ApiError(400, `Table with id:${tableId} does not exist`);

    console.log(table);

}

export const getAllTables=async(req: Request, res: Response)=>{
    const {shopId} = req?.params;
    if(!shopId) throw new ApiError(400,"shopId is required!");

    const shop = await prisma.shop.findUnique({where: {id: shopId}});
    if(!shop) throw new ApiError(400,"Shop does not exist");
    
    const tables = await prisma.table.findMany({where: {shopId: shopId}});

    res.status(200).json({ success: true, message: `Tables for shopId: ${shopId} fetched successfully.` , data: {tables} });
}

export const updateTable=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Table updated successfully' });
}

export const deleteTable=async(req: Request, res: Response)=>{
    res.status(200).json({ message: 'Table deleted successfully' });
}