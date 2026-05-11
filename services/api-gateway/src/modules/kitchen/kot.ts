import type { DbClient } from "../billing/numbering";

// "2026-05-11" — local-date key for the daily sequence. Per-shop daily reset.
export const dailyKey = (now = new Date()): string => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const nextKotNumber = async (db: DbClient, shopId: string, now = new Date()): Promise<{ kotNumber: number; dailyKey: string }> => {
    const key = dailyKey(now);
    const seq = await db.kotDailySequence.upsert({
        where: { shopId_dailyKey: { shopId, dailyKey: key } },
        update: { lastNumber: { increment: 1 } },
        create: { shopId, dailyKey: key, lastNumber: 1 },
    });
    return { kotNumber: seq.lastNumber, dailyKey: key };
};

type KotItemSnapshot = {
    orderItemId: string;
    name: string;
    variantName: string | null;
    addons: { name: string; price: number }[];
    quantity: number;
};

// Build a snapshot of OrderItems for the KOT JSON payload. We freeze name/variant/addons
// so the KOT print + Kitchen Display stay readable even if the menu changes later.
export const buildKotItemsSnapshot = (orderItems: {
    id: string;
    name: string;
    variantName: string | null;
    addons: unknown;
    quantity: number;
}[]): KotItemSnapshot[] => {
    return orderItems.map((oi) => ({
        orderItemId: oi.id,
        name: oi.name,
        variantName: oi.variantName ?? null,
        addons: Array.isArray(oi.addons) ? (oi.addons as { name: string; price: number }[]) : [],
        quantity: oi.quantity,
    }));
};

// Called inside the same transaction as Order creation. Looks at the table session:
// if there's a prior non-cancelled order, this KOT is marked supplementary.
export const createInitialKot = async (
    db: DbClient,
    params: {
        shopId: string;
        orderId: string;
        tableSessionId: string | null;
        orderItems: { id: string; name: string; variantName: string | null; addons: unknown; quantity: number }[];
    },
) => {
    let isSupplementary = false;
    if (params.tableSessionId) {
        const priorCount = await db.order.count({
            where: {
                tableSessionId: params.tableSessionId,
                status: { not: "CANCELLED" },
                id: { not: params.orderId },
            },
        });
        isSupplementary = priorCount > 0;
    }

    const { kotNumber, dailyKey: key } = await nextKotNumber(db, params.shopId);
    const itemsSnapshot = buildKotItemsSnapshot(params.orderItems);

    return db.kot.create({
        data: {
            shopId: params.shopId,
            orderId: params.orderId,
            kotNumber,
            dailyKey: key,
            isSupplementary,
            items: itemsSnapshot as object[],
        },
    });
};

// updateOrderItems currently delete-recreates rows. Rebuild the KOT in place so the
// existing kotNumber is preserved (no fresh sequence consumed). Used when captain
// edits a still-PENDING order before it's printed/sent to kitchen.
export const rebuildKot = async (
    db: DbClient,
    params: {
        orderId: string;
        orderItems: { id: string; name: string; variantName: string | null; addons: unknown; quantity: number }[];
    },
) => {
    const itemsSnapshot = buildKotItemsSnapshot(params.orderItems);
    return db.kot.update({
        where: { orderId: params.orderId },
        data: {
            items: itemsSnapshot as object[],
            // reprint required after edit — clear printedAt to surface it on KDS again
            printedAt: null,
        },
    });
};

// Marks a KOT as printed and increments the print counter. Idempotent — call once
// per print action; reprints bump printCount.
export const markKotPrinted = async (db: DbClient, kotId: string) => {
    return db.kot.update({
        where: { id: kotId },
        data: {
            printedAt: new Date(),
            printCount: { increment: 1 },
        },
    });
};
