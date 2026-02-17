import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "@repo/database";

export const getShopMenu = async (req: Request, res: Response) => {
    const {shopId} = req.params;
    if(!shopId) throw new ApiError(400, "ShopId is required!");

    const shop = await prisma.shop.findUnique({where: {id: shopId}});
    if(!shop) throw new ApiError(400, "Shop does not exist.");

    const menu = await prisma.menu.findUnique({where: {shopId: shopId}, include: {
        shop: true,
        categories : {
            include: {
                items: true
            }
        }
    }});

    return res.json({success: true, message: "Menu fetched successfully", data: {menu}});
}

