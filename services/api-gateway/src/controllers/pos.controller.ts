import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import * as z from "zod";
import { computeCharges } from "../modules/billing/compute";

const PreviewItemSchema = z.object({
    itemId: z.cuid(),
    variantId: z.cuid().nullish(),
    addonIds: z.array(z.cuid()).optional(),
    quantity: z.number().int().positive(),
});

const PreviewSchema = z.object({
    items: z.array(PreviewItemSchema).min(0),
    discountType: z.enum(["PERCENT", "FLAT"]).nullish(),
    discountValue: z.number().int().min(0).optional(),
});

const UpdateSessionSchema = z.object({
    pax: z.number().int().min(0).max(50).nullish(),
    // Optional customer attach in the same patch. Either pass an existing customerId
    // OR { customerPhone, customerName? } to upsert + attach. Pass customerId: null
    // to detach.
    customerId: z.string().nullish(),
    customerPhone: z.string().min(1).optional(),
    customerName: z.string().min(1).max(80).optional(),
}).refine(
    (d) =>
        d.pax !== undefined ||
        d.customerId !== undefined ||
        d.customerPhone !== undefined,
    { message: "At least one field is required" },
);

// GET /pos/table/:tableId — returns the live state of one table for the punch screen:
// running session (if any) with non-cancelled orders + shop billing config so the
// client can show table state and request previews against the same rates.
export const getTablePos = async (req: Request<{ tableId: string }>, res: Response) => {
    const { tableId } = req.params;
    if (!tableId) throw new ApiError(400, "tableId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const table = await prisma.table.findUnique({
        where: { id: tableId },
        select: { id: true, shopId: true, tableNumber: true, deletedAt: true },
    });
    if (!table || table.deletedAt) throw new ApiError(404, "Table not found");
    if (table.shopId !== shopId) throw new ApiError(403, "You do not have access to this table");

    const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { cgstRate: true, sgstRate: true, serviceChargeRate: true, gstNumber: true },
    });
    if (!shop) throw new ApiError(404, "Shop not found");

    const session = await prisma.tableSession.findFirst({
        where: { shopId, tableId, endedAt: null },
        include: {
            customer: { select: { id: true, phone: true, name: true } },
            orders: {
                where: { status: { not: "CANCELLED" } },
                orderBy: { createdAt: "asc" },
                include: {
                    orderItems: true,
                },
            },
            bills: {
                where: { parentBillId: null },
                select: { id: true, billNumber: true, status: true },
                take: 1,
            },
        },
    });

    return res.status(200).json({
        success: true,
        message: "POS state fetched",
        data: {
            table: { id: table.id, tableNumber: table.tableNumber },
            shop: {
                cgstRate: shop.cgstRate,
                sgstRate: shop.sgstRate,
                serviceChargeRate: shop.serviceChargeRate,
                gstNumber: shop.gstNumber,
            },
            session,
        },
    });
};

// POST /pos/preview — pure compute: resolve items + variants + addons against the
// menu, sum subtotal, run computeCharges() with the shop's rates. No DB write.
// Used by the punch screen for live tax/total preview as the captain builds the order.
export const previewTotals = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = PreviewSchema.safeParse(req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const { items, discountType, discountValue } = validation.data;

    const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { cgstRate: true, sgstRate: true, serviceChargeRate: true },
    });
    if (!shop) throw new ApiError(404, "Shop not found");

    if (items.length === 0) {
        const totals = computeCharges({
            subtotal: 0,
            discountType: discountType ?? null,
            discountValue: discountValue ?? 0,
            cgstRateBp: shop.cgstRate,
            sgstRateBp: shop.sgstRate,
            serviceChargeRateBp: shop.serviceChargeRate,
        });
        return res.status(200).json({ success: true, message: "Preview", data: { preview: totals } });
    }

    const itemIds = Array.from(new Set(items.map((i) => i.itemId)));
    const variantIds = Array.from(new Set(items.map((i) => i.variantId).filter((x): x is string => !!x)));
    const addonIds = Array.from(new Set(items.flatMap((i) => i.addonIds ?? [])));

    const [menuItems, variants, addons] = await Promise.all([
        prisma.item.findMany({
            where: { id: { in: itemIds }, shopId, deletedAt: null },
            select: { id: true, price: true, addonGroups: { select: { addonGroupId: true } } },
        }),
        variantIds.length
            ? prisma.itemVariant.findMany({
                where: { id: { in: variantIds }, deletedAt: null },
                select: { id: true, itemId: true, price: true },
            })
            : Promise.resolve([] as { id: string; itemId: string; price: number }[]),
        addonIds.length
            ? prisma.addon.findMany({
                where: { id: { in: addonIds }, deletedAt: null, addonGroup: { shopId, deletedAt: null } },
                select: { id: true, price: true, addonGroupId: true },
            })
            : Promise.resolve([] as { id: string; price: number; addonGroupId: string }[]),
    ]);

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const addonMap = new Map(addons.map((a) => [a.id, a]));

    let subtotal = 0;
    for (const line of items) {
        const item = itemMap.get(line.itemId);
        if (!item) throw new ApiError(400, `Item ${line.itemId} does not exist in this shop`);

        let unitPrice = item.price;
        if (line.variantId) {
            const variant = variantMap.get(line.variantId);
            if (!variant) throw new ApiError(400, `Variant ${line.variantId} not found`);
            if (variant.itemId !== line.itemId) throw new ApiError(400, `Variant does not belong to item`);
            unitPrice = variant.price;
        }

        if (line.addonIds && line.addonIds.length) {
            const allowedGroupIds = new Set(item.addonGroups.map((g) => g.addonGroupId));
            for (const addonId of line.addonIds) {
                const addon = addonMap.get(addonId);
                if (!addon) throw new ApiError(400, `Addon ${addonId} not found`);
                if (!allowedGroupIds.has(addon.addonGroupId)) {
                    throw new ApiError(400, `Addon is not allowed on item`);
                }
                unitPrice += addon.price;
            }
        }

        subtotal += unitPrice * line.quantity;
    }

    const preview = computeCharges({
        subtotal,
        discountType: discountType ?? null,
        discountValue: discountValue ?? 0,
        cgstRateBp: shop.cgstRate,
        sgstRateBp: shop.sgstRate,
        serviceChargeRateBp: shop.serviceChargeRate,
    });

    return res.status(200).json({ success: true, message: "Preview", data: { preview } });
};

// PATCH /pos/session/:sessionId — updates PAX and/or customer attachment in one shot.
// Customer attach supports either an existing customerId or upsert by phone.
// Pass customerId: null to detach.
export const updateSession = async (req: Request<{ sessionId: string }>, res: Response) => {
    const { sessionId } = req.params;
    if (!sessionId) throw new ApiError(400, "sessionId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const validation = UpdateSessionSchema.safeParse(req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const existing = await prisma.tableSession.findUnique({ where: { id: sessionId } });
    if (!existing) throw new ApiError(404, "Session not found");
    if (existing.shopId !== shopId) throw new ApiError(403, "You do not have access to this session");
    if (existing.endedAt) throw new ApiError(400, "Cannot update an ended session");

    const { pax, customerId, customerPhone, customerName } = validation.data;

    const session = await prisma.$transaction(async (tx) => {
        // Build the update payload incrementally so unspecified fields stay untouched.
        const data: { pax?: number | null; customerId?: string | null } = {};

        if (pax !== undefined) data.pax = pax ?? null;

        if (customerPhone) {
            // Upsert by phone, then attach. Validates phone format at the Customer model
            // level via the existing PhoneE164Schema on /customer/upsert; here we accept
            // looser input since the picker often passes back what the user typed.
            const customer = await tx.customer.upsert({
                where: { shopId_phone: { shopId, phone: customerPhone } },
                update: customerName ? { name: customerName } : {},
                create: { shopId, phone: customerPhone, name: customerName ?? null },
            });
            data.customerId = customer.id;
        } else if (customerId !== undefined) {
            data.customerId = customerId; // can be null to detach
        }

        return tx.tableSession.update({
            where: { id: sessionId },
            data,
            include: {
                customer: { select: { id: true, phone: true, name: true } },
            },
        });
    });

    return res.status(200).json({
        success: true,
        message: "Session updated",
        data: { session },
    });
};
