import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import * as z from "zod";
import { PhoneE164Schema } from "@repo/types";

const SearchSchema = z.object({
    q: z.string().min(1).max(20),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

const UpsertSchema = z.object({
    phone: PhoneE164Schema,
    name: z.string().min(1).max(80).optional(),
});

// GET /customer/search?q=98765&limit=10
// Substring search on phone (most common cashier flow: type last 4–5 digits).
// Also matches name prefix as a fallback. Shop-scoped.
export const searchCustomers = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = SearchSchema.safeParse(req.query);
    if (!validation.success) throw new ApiError(400, "Invalid query", [validation.error]);

    const { q, limit } = validation.data;

    const customers = await prisma.customer.findMany({
        where: {
            shopId,
            OR: [
                { phone: { contains: q } },
                { name: { contains: q, mode: "insensitive" } },
            ],
        },
        orderBy: [{ visits: "desc" }, { updatedAt: "desc" }],
        take: limit ?? 10,
        select: { id: true, phone: true, name: true, visits: true, totalSpent: true },
    });

    return res.status(200).json({
        success: true,
        message: "Customers fetched",
        data: { customers },
    });
};

// POST /customer/upsert  body: { phone, name? }
// Cashier-friendly: idempotent on (shopId, phone). Used by the POS customer picker
// when the cashier types a phone that doesn't exist yet.
export const upsertCustomer = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = UpsertSchema.safeParse(req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const { phone, name } = validation.data;

    const customer = await prisma.customer.upsert({
        where: { shopId_phone: { shopId, phone } },
        update: name ? { name } : {},
        create: { shopId, phone, name: name ?? null },
        select: { id: true, phone: true, name: true, visits: true, totalSpent: true },
    });

    return res.status(200).json({
        success: true,
        message: "Customer saved",
        data: { customer },
    });
};
