import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";

export const getShopMenu = async (req: Request<{shopId: string}>, res: Response) => {
    const {shopId} = req.params;
    if(!shopId) throw new ApiError(400, "ShopId is required!");

    const shop = await prisma.shop.findUnique({where: {id: shopId}});
    if(!shop) throw new ApiError(400, "Shop does not exist.");

    const menu = await prisma.menu.findUnique({
        where: { shopId },
        include: {
            categories: {
                where: { deletedAt: null },
                include: {
                    items: {
                        where: { deletedAt: null },
                        include: {
                            variants: {
                                where: { deletedAt: null },
                                orderBy: { sortOrder: "asc" },
                            },
                            addonGroups: {
                                include: {
                                    addonGroup: {
                                        include: {
                                            addons: { orderBy: { sortOrder: "asc" } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Flatten the M:N pivot so the storefront/dashboard see a clean array of
    // addon groups directly on each item.
    const shaped = menu
        ? {
            ...menu,
            categories: menu.categories.map((c) => ({
                ...c,
                items: c.items.map((i) => {
                    const { addonGroups, ...rest } = i as typeof i & { addonGroups: any[] };
                    return {
                        ...rest,
                        addonGroups: (addonGroups ?? [])
                            .map((iag) => iag.addonGroup)
                            .filter((g) => g && !g.deletedAt),
                    };
                }),
            })),
        }
        : null;

    return res.json({success: true, message: "Menu fetched successfully", data: {menu: shaped}});
}
