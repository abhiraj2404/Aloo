import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { OrderStatus, prisma } from "@repo/database";
import { markKotPrinted } from "../modules/kitchen/kot";
import { orderEvents } from "./order.controller";

// SSE events for the Kitchen Display. We piggy-back on orderEvents since KOTs are
// created in the same transaction as Orders — when an order is created, the KOT is
// already there. The kitchen display listens to order events and re-fetches active KOTs.
// (A dedicated kot:* channel would be tighter; deferred for now.)

const KOT_INCLUDES = {
    order: {
        include: {
            tableSession: { include: { table: true } },
            // Live order items so Kitchen Display can pair each KOT item with its
            // current per-item status (PENDING/READY/SERVED/etc.) for interaction.
            orderItems: { select: { id: true, status: true } },
        },
    },
} as const;

// Active KOTs = KOTs whose parent order has at least one non-SERVED/VOID item.
// For Phase 2 (no per-item-status UI yet), "active" means the order is not
// COMPLETED or CANCELLED — same shape, less precise. Phase 3 tightens this.
const buildActiveKotsQuery = (shopId: string) => ({
    where: {
        shopId,
        order: {
            is: {
                status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
            },
        },
    },
    include: KOT_INCLUDES,
    orderBy: { createdAt: "asc" as const },
});

export const getActiveKots = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const kots = await prisma.kot.findMany(buildActiveKotsQuery(shopId));

    return res.status(200).json({
        success: true,
        message: "Active KOTs fetched",
        data: { kots },
    });
};

export const getKotById = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "kotId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const kot = await prisma.kot.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    orderItems: true,
                    tableSession: { include: { table: true } },
                },
            },
            shop: { select: { name: true } },
        },
    });
    if (!kot) throw new ApiError(404, "KOT not found");
    if (kot.shopId !== shopId) throw new ApiError(403, "You do not have access to this KOT");

    return res.status(200).json({
        success: true,
        message: "KOT fetched",
        data: { kot },
    });
};

export const printKot = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "kotId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const existing = await prisma.kot.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "KOT not found");
    if (existing.shopId !== shopId) throw new ApiError(403, "You do not have access to this KOT");

    const kot = await markKotPrinted(prisma, id);

    return res.status(200).json({
        success: true,
        message: "KOT marked as printed",
        data: { kot },
    });
};

// Kitchen Display SSE. Listens to the same orderEvents channel as the Orders view
// and broadcasts a "refresh" hint — client re-fetches active KOTs on each event.
// Simpler than a dedicated kot event bus and keeps everything in sync.
export const streamKots = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const snapshot = await prisma.kot.findMany(buildActiveKotsQuery(shopId));
    res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);

    const onOrderEvent = () => {
        res.write(`event: refresh\ndata: {}\n\n`);
    };

    const eventKey = `orders:${shopId}`;
    orderEvents.on(eventKey, onOrderEvent);

    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 30000);

    req.on("close", () => {
        orderEvents.off(eventKey, onOrderEvent);
        clearInterval(heartbeat);
    });
};
