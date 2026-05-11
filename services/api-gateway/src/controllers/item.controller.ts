import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { ApiError } from "../utils/ApiError";
import { CreateVariantInputSchema } from "@repo/types";
import z from "zod";

const ITEM_INCLUDE = {
    variants: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" as const } },
    addonGroups: {
        include: {
            addonGroup: {
                include: {
                    addons: { orderBy: { sortOrder: "asc" as const } },
                },
            },
        },
    },
} as const;

// Flattens prisma's M:N pivot shape into a clean array of addon groups.
const shapeItem = (item: any) => {
    if (!item) return item;
    const { addonGroups, ...rest } = item;
    return {
        ...rest,
        addonGroups: (addonGroups ?? [])
            .map((iag: any) => iag.addonGroup)
            .filter((g: any) => g && !g.deletedAt),
    };
};

export const createItem = async (req: Request, res: Response) => {
    const {categoryId, name, price, isVeg, image } = req.body;
    const shopId = req.user?.shopMembership?.shopId;

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

export const getItemById = async (req: Request<{id: string}>, res: Response) => {

    const {id} = req.params;
    const { shopId } = req.body;
    if (!shopId) {
        throw new ApiError(400, 'shopId   is required');
    }
    const item = await prisma.item.findUnique({
        where: { id },
        include: ITEM_INCLUDE,
    });

    if (!item || item?.shopId !== shopId || item.deletedAt !== null) {
        throw new ApiError(404, 'Item not found');
    }

    res.status(200).json({
        success: true,
        message: 'Item details fetched successfully',
        data: shapeItem(item),
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


export const getItemsByCategory = async (req: Request<{id: string}>, res: Response) => {
    // TODO : get shopId from authToken, category id from params
    const {id: categoryId} = req.params;
    const { shopId } = req.body;
    if (!shopId || !categoryId) {
        throw new ApiError(400, 'shopId and categoryId are required');
    }
    const items = await prisma.item.findMany({
        where: {
            shopId,
            categoryId,
            deletedAt: null
        },
        include: ITEM_INCLUDE,
    });

    res.status(200).json({
        success: true,
        message: 'Items fetched successfully',
        data: items.map(shapeItem),
    });
}

// ── Variants (nested under an item) ─────────────────────────────────────
const ensureItemOwnedByUser = async (itemId: string, userShopId: string) => {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt) throw new ApiError(404, "Item not found");
    if (item.shopId !== userShopId) throw new ApiError(403, "You do not have access to this item");
    return item;
};

export const createVariant = async (req: Request<{ itemId: string }>, res: Response) => {
    const { itemId } = req.params;
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    if (!itemId) throw new ApiError(400, "Item id is required");

    await ensureItemOwnedByUser(itemId, shopId);

    const validation = z.safeParse(CreateVariantInputSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);
    const { name, price, sortOrder } = validation.data;

    const variant = await prisma.itemVariant.create({
        data: { itemId, name, price, sortOrder: sortOrder ?? 0 },
    });

    res.status(201).json({ success: true, message: "Variant created", data: { variant } });
};

export const updateVariant = async (req: Request<{ variantId: string }>, res: Response) => {
    const { variantId } = req.params;
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    if (!variantId) throw new ApiError(400, "Variant id is required");

    const validation = z.safeParse(CreateVariantInputSchema.partial(), req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const existing = await prisma.itemVariant.findUnique({ where: { id: variantId }, include: { item: true } });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Variant not found");
    if (existing.item.shopId !== shopId) throw new ApiError(403, "You do not have access to this variant");

    const variant = await prisma.itemVariant.update({
        where: { id: variantId },
        data: validation.data,
    });

    res.status(200).json({ success: true, message: "Variant updated", data: { variant } });
};

export const deleteVariant = async (req: Request<{ variantId: string }>, res: Response) => {
    const { variantId } = req.params;
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    if (!variantId) throw new ApiError(400, "Variant id is required");

    const existing = await prisma.itemVariant.findUnique({ where: { id: variantId }, include: { item: true } });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Variant not found");
    if (existing.item.shopId !== shopId) throw new ApiError(403, "You do not have access to this variant");

    await prisma.itemVariant.update({ where: { id: variantId }, data: { deletedAt: new Date() } });

    res.status(200).json({ success: true, message: "Variant deleted" });
};

// ── Item ↔ Addon group attachments ───────────────────────────────────────
const SetItemAddonGroupsSchema = z.object({
    addonGroupIds: z.array(z.cuid()),
});

export const setItemAddonGroups = async (req: Request<{ itemId: string }>, res: Response) => {
    const { itemId } = req.params;
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    if (!itemId) throw new ApiError(400, "Item id is required");

    const validation = z.safeParse(SetItemAddonGroupsSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);
    const { addonGroupIds } = validation.data;

    await ensureItemOwnedByUser(itemId, shopId);

    if (addonGroupIds.length > 0) {
        const groups = await prisma.addonGroup.findMany({
            where: { id: { in: addonGroupIds }, shopId, deletedAt: null },
            select: { id: true },
        });
        if (groups.length !== addonGroupIds.length) {
            throw new ApiError(400, "One or more addon groups not found in this shop");
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.itemAddonGroup.deleteMany({ where: { itemId } });
        if (addonGroupIds.length > 0) {
            await tx.itemAddonGroup.createMany({
                data: addonGroupIds.map((addonGroupId) => ({ itemId, addonGroupId })),
            });
        }
    });

    const item = await prisma.item.findUnique({ where: { id: itemId }, include: ITEM_INCLUDE });
    res.status(200).json({ success: true, message: "Addon groups updated", data: { item: shapeItem(item) } });
};
