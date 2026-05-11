import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { ApiError } from "../utils/ApiError";
import { CreateAddonGroupInputSchema, UpdateAddonGroupInputSchema } from "@repo/types";
import z from "zod";

const ADDON_GROUP_INCLUDE = {
    addons: { orderBy: { sortOrder: "asc" as const } },
} as const;

export const listAddonGroups = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const groups = await prisma.addonGroup.findMany({
        where: { shopId, deletedAt: null },
        include: ADDON_GROUP_INCLUDE,
        orderBy: { name: "asc" },
    });

    res.status(200).json({ success: true, message: "Addon groups fetched", data: { addonGroups: groups } });
};

export const createAddonGroup = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = z.safeParse(CreateAddonGroupInputSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);
    const { name, minSelect, maxSelect, addons } = validation.data;

    const group = await prisma.addonGroup.create({
        data: {
            shopId,
            name,
            minSelect,
            maxSelect,
            addons: {
                create: addons.map((a, i) => ({
                    name: a.name,
                    price: a.price,
                    sortOrder: a.sortOrder ?? i,
                })),
            },
        },
        include: ADDON_GROUP_INCLUDE,
    });

    res.status(201).json({ success: true, message: "Addon group created", data: { addonGroup: group } });
};

export const updateAddonGroup = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Addon group id is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = z.safeParse(UpdateAddonGroupInputSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);
    const { name, minSelect, maxSelect, addons } = validation.data;

    const existing = await prisma.addonGroup.findUnique({
        where: { id },
        include: { addons: true },
    });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Addon group not found");
    if (existing.shopId !== shopId) throw new ApiError(403, "You do not have access to this addon group");

    const finalMin = minSelect ?? existing.minSelect;
    const finalMax = maxSelect ?? existing.maxSelect;
    if (finalMax < finalMin) throw new ApiError(400, "maxSelect must be ≥ minSelect");

    const updated = await prisma.$transaction(async (tx) => {
        await tx.addonGroup.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(minSelect !== undefined ? { minSelect } : {}),
                ...(maxSelect !== undefined ? { maxSelect } : {}),
            },
        });

        if (addons !== undefined) {
            // Diff-and-apply: keep ids the client sent, update them, create new ones
            // for items without id, delete anything not in the list.
            const incomingIds = new Set(addons.filter((a) => a.id).map((a) => a.id!));
            const toDelete = existing.addons.filter((a) => !incomingIds.has(a.id));
            if (toDelete.length) {
                await tx.addon.deleteMany({ where: { id: { in: toDelete.map((a) => a.id) } } });
            }
            for (let i = 0; i < addons.length; i++) {
                const a = addons[i]!;
                if (a.id) {
                    await tx.addon.update({
                        where: { id: a.id },
                        data: { name: a.name, price: a.price, sortOrder: a.sortOrder ?? i },
                    });
                } else {
                    await tx.addon.create({
                        data: { addonGroupId: id, name: a.name, price: a.price, sortOrder: a.sortOrder ?? i },
                    });
                }
            }
        }

        return tx.addonGroup.findUnique({ where: { id }, include: ADDON_GROUP_INCLUDE });
    });

    res.status(200).json({ success: true, message: "Addon group updated", data: { addonGroup: updated } });
};

export const deleteAddonGroup = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Addon group id is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const existing = await prisma.addonGroup.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new ApiError(404, "Addon group not found");
    if (existing.shopId !== shopId) throw new ApiError(403, "You do not have access to this addon group");

    await prisma.$transaction(async (tx) => {
        // Detach from all items first; then soft-delete the group.
        await tx.itemAddonGroup.deleteMany({ where: { addonGroupId: id } });
        await tx.addonGroup.update({ where: { id }, data: { deletedAt: new Date() } });
    });

    res.status(200).json({ success: true, message: "Addon group deleted" });
};
