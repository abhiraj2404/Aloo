import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { ApiError } from "../utils/ApiError.js";

export const createItem = async (req: Request, res: Response) => {
    const { shopId, categoryId, name, price, isVeg, image } = req.body;

    if (!shopId || !categoryId || !name || !price) {
        throw new ApiError(400, 'Missing required fields');
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
        throw new ApiError(404, 'Shop not found');
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }
    // from frontend price should be upto 2 decimal places 
    let value = Number(price);
    if (isNaN(value) || value < 0) {
        throw new ApiError(400, 'Invalid price value');
    }
    value = value * 100;


    const item = await prisma.item.create({
        data: {
            shopId,
            categoryId,
            name,
            price: value,
            isVeg: isVeg || true,
            image
        }
    });

    res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: item
    });
}

export const getItemById = async (req: Request, res: Response) => {

    const id = req.params.id;
    const { shopId } = req.body;
    if (!shopId) {
        throw new ApiError(400, 'shopId   is required');
    }
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item || item?.shopId !== shopId || item.deletedAt !== null) {
        throw new ApiError(404, 'Item not found');
    }

    res.status(200).json({
        success: true,
        message: 'Item details fetched successfully',
        data: item,
    });
}

//todo: creating separate update route  for updating availability,Ved ?
export const updateItem = async (req: Request, res: Response) => {
    //todo: asking only updated filds from frontend?
    const { id, shopId, name, price, isVeg, isAvailable, image } = req.body;
    if (!id || !shopId) throw new ApiError(400, "Item/Shop id is required!");

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item || item?.shopId !== shopId) {
        throw new ApiError(404, 'Item not found');
    }

    //todo: validate fields and types
    const updatedItem: any = {};
    if (name) updatedItem.name = name;
    if (price) {
        let value = Number(price);
        if (isNaN(value) || value < 0) {
            throw new ApiError(400, 'Invalid price value');
        }
        updatedItem.price = value * 100;
    }
    if (isVeg !== undefined) updatedItem.isVeg = isVeg;
    if (isAvailable !== undefined) updatedItem.isAvailable = isAvailable;
    if (image) updatedItem.image = image;

    const updatedItemResult = await prisma.item.update({
        where: { id },
        data: updatedItem,
    });

    res.status(200).json(
        {
            success: true,
            message: 'Item updated successfully',
            data: updatedItemResult
        }
    );
}

//todo: can make function to check item ownership by shop
//todo: should we add boolean flag "isDeleted";
//todo : shopId from auth token?
export const deleteItem = async (req: Request, res: Response) => {
    const { id, shopId } = req.body;
    if (!id || !shopId) throw new ApiError(400, "Item/Shop's id is required!");

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item || item?.shopId !== shopId) {
        throw new ApiError(404, 'Item not found');
    }

    await prisma.item.update({

        where: { id },
        data: { deletedAt: new Date() }
    });

    res.status(200).json({
        success: true,
        message: 'Item deleted successfully'
    });
}


export const getItemsByCategory = async (req: Request, res: Response) => {
    // TODO : get shopId from authToken, category id from params 
    const categoryId = req.params.id;
    const { shopId } = req.body;
    if (!shopId || !categoryId) {
        throw new ApiError(400, 'shopId and categoryId are required');
    }
    const items = await prisma.item.findMany({
        where: {
            shopId,
            categoryId,
            deletedAt: null
        }
    });

    res.status(200).json({
        success: true,
        message: 'Items fetched successfully',
        data: items,
    });
}