import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from '@repo/database';

export const createCategory = async (req: Request, res: Response) => {
    const { name, menuId } = req.body;

    if (!name) throw new ApiError(400, 'Category name is required');
    if (!menuId) throw new ApiError(400, 'Menu ID is required');

    const isMenuExist = await prisma.menu.findUnique({
        where: {
            id: menuId
        }
    });

    //Todo: handle duplicate category names for same menu
    if (!isMenuExist) throw new ApiError(404, 'MenuId not found');

    const data = await prisma.category.create({
        data: {
            name,
            menuId
        }
    })

    res.status(201).json({
        sucess: true,
        message: 'Category created successfully',
        data: data
    });
}
//todo: a middleware to add menuId to req.body from auth token
export const getCategoryById = async (req: Request, res: Response) => {

    const id = req?.params.id;
    const { menuId } = req.body;
    if (!id) throw new ApiError(400, 'Category ID is required');

    const category = await prisma.category.findUnique({
        where: {
            id,
            deletedAt: null
        }
    });
    if (!category || category?.menuId !== menuId || category.deletedAt !== null) throw new ApiError(404, 'Category not found');
    res.status(200).json({
        success: true,
        message: 'Category details fetched successfully',
        data: category
    });
}

export const updateCategory = async (req: Request, res: Response) => {

    const { id, name, isActive, menuId } = req.body;

    if (!id) throw new ApiError(400, 'Category ID is required');
    if (!name && typeof isActive !== 'boolean') {
        throw new ApiError(400, 'Atleast one field (name or isActive) is required to update');
    }

    const category = await prisma.category.findUnique({
        where: {
            id
        }
    });
    if (!category || category?.menuId !== menuId || category.deletedAt !== null) throw new ApiError(404, 'Category not found');

    //update name if provided
    if (name) {
        await prisma.category.update({
            where: {
                id
            },
            data: {
                name
            }
        });
    }
    //update isActive if provided
    if (typeof isActive === 'boolean') {
        await prisma.category.update({
            where: {
                id
            },
            data: {
                isActive
            }
        });
    }

    res.status(200).json(
        {
            success: true,
            message: isActive ? 'Category toggled successfully' : 'Category updated successfully'
        }
    );
}

export const deleteCategory = async (req: Request, res: Response) => {

    const { id, menuId } = req.body;

    if (!id) throw new ApiError(400, 'Category ID is required');
    const category = await prisma.category.findUnique({
        where: {
            id
        }
    });
    if (!category || category?.menuId !== menuId || category.deletedAt !== null) throw new ApiError(404, 'Category not found');

    await prisma.category.update({
        where: {
            id
        },
        data: {
            deletedAt: new Date()
        }
    });
    res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
    });
}

export const reorderCategories = async (req: Request, res: Response) => {
    //todo: should we implement multiple category reorder at once or singe category move up/down?
}


export const getCategoriesByMenuId = async (req: Request, res: Response) => {

    const menuId = req?.params.menuId;
    if (!menuId) throw new ApiError(400, 'Menu ID is required');
    const categories = await prisma.category.findMany({
        where: {
            menuId,
            deletedAt: null
        },
        orderBy: {
            orderIndex: 'asc'
        }
    });

    if (!categories || categories.length === 0) throw new ApiError(404, 'No categories found for this menu');
    res.status(200).json({
        success: true,
        message: 'Categories fetched successfully',
        data: categories
    });
} 