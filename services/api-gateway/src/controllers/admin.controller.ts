import { prisma } from "@repo/database";
import type { Request, Response } from "express";

export const getAllShops = async (req: Request, res: Response) => {
    const shops = await prisma.shop.findMany();

    return res.json({
        success: true,
        message: "Shops fetched successfully!",
        data: {shops}
    });
}

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();

    return res.json({
        success: true,
        message: "Users fetched successfully!",
        data: {users}
    });
}