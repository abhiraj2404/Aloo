import type { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import z from "zod";
import { prisma, ShopRole } from "@repo/database";
import { AddStaffSchema } from "@repo/types";
import { ApiError } from "../utils/ApiError";
import { sendStaffCredentialsEmail } from "../utils/email";
import logger from "../utils/logger";

const generatePassword = () => crypto.randomBytes(6).toString("base64url");

export const getShopStaff = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not associated with any shop");

    const staff = await prisma.shopUser.findMany({
        where: { shopId, role: ShopRole.STAFF },
        include: {
            user: { select: { id: true, email: true, name: true, createdAt: true } },
        },
        orderBy: { joinedAt: "desc" },
    });

    res.status(200).json({
        success: true,
        message: "Staff fetched successfully",
        data: { staff },
    });
};

export const addStaff = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not associated with any shop");

    const validation = z.safeParse(AddStaffSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);
    const { email } = validation.data;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new ApiError(404, "Shop not found");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultName = email.split("@")[0] || "Staff";

    const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                name: defaultName,
            },
        });

        const membership = await tx.shopUser.create({
            data: {
                userId: user.id,
                shopId,
                role: ShopRole.STAFF,
            },
            include: {
                user: { select: { id: true, email: true, name: true, createdAt: true } },
            },
        });

        return { user, membership };
    });

    try {
        const origin = req.get("origin") || req.get("referer") || "";
        const loginUrl = origin ? `${origin.replace(/\/$/, "")}/auth/signin` : "https://aloo.abhiraj0x.me/auth/signin";

        await sendStaffCredentialsEmail({
            to: email,
            shopName: shop.name,
            password,
            loginUrl,
        });
    } catch (err: any) {
        logger.error("Failed to send staff credentials email; rolling back user", { error: err?.message });
        await prisma.shopUser.delete({ where: { id: created.membership.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: created.user.id } }).catch(() => {});
        throw new ApiError(502, "Failed to send credentials email. Staff was not added.");
    }

    res.status(201).json({
        success: true,
        message: "Staff added and credentials emailed",
        data: { staff: created.membership },
    });
};

export const removeStaff = async (req: Request<{ id: string }>, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not associated with any shop");

    const staffId = req.params.id;
    if (!staffId) throw new ApiError(400, "Staff id is required");

    const membership = await prisma.shopUser.findUnique({ where: { id: staffId } });
    if (!membership) throw new ApiError(404, "Staff member not found");
    if (membership.shopId !== shopId) throw new ApiError(403, "You do not have access to this staff member");
    if (membership.role === ShopRole.OWNER) throw new ApiError(403, "Cannot remove the shop owner");

    await prisma.shopUser.delete({ where: { id: staffId } });

    res.status(200).json({
        success: true,
        message: "Staff removed successfully",
    });
};
