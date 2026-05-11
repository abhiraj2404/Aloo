"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, ChefHat, Check, CheckCheck, Loader2, Pause, Printer, RefreshCw, Undo2, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { KotService, OrderService, type KotDTO } from "@repo/api-sdk";
import type { OrderItemStatus } from "@repo/types";
import { useToast } from "@/lib/use-toast";
import { EightySixSheet } from "./eighty-six-sheet";

const ageMinutes = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

const ageColor = (mins: number) => {
    if (mins >= 15) return "border-red-500 bg-red-50";
    if (mins >= 8) return "border-amber-500 bg-amber-50";
    return "border-gray-200 bg-white";
};

const ageBadge = (mins: number) => {
    if (mins >= 15) return "bg-red-500 text-white";
    if (mins >= 8) return "bg-amber-500 text-white";
    return "bg-gray-100 text-gray-700";
};

const statusStyles: Record<OrderItemStatus, { label: string; dot: string; row: string }> = {
    PENDING: { label: "PENDING", dot: "bg-gray-400",   row: "" },
    READY:   { label: "READY",   dot: "bg-amber-500",  row: "" },
    SERVED:  { label: "SERVED",  dot: "bg-green-500",  row: "opacity-50 line-through" },
    HOLD:    { label: "HOLD",    dot: "bg-blue-500",   row: "italic" },
    VOID:    { label: "VOID",    dot: "bg-red-500",    row: "opacity-30 line-through" },
};

// Items that are fully done don't need to stay on screen — a KOT card disappears
// when every item is SERVED or VOID.
const isCardDone = (kot: KotDTO) => {
    const items = kot.order?.orderItems ?? [];
    if (items.length === 0) return false;
    return items.every((i) => i.status === "SERVED" || i.status === "VOID");
};

export function KitchenDisplay({ shopId }: { shopId: string }) {
    const { error, success } = useToast();
    const [kots, setKots] = useState<KotDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setTick] = useState(0); // forces age recalc every minute
    const [pendingItem, setPendingItem] = useState<string | null>(null);
    const [is86Open, setIs86Open] = useState(false);

    const fetchKots = useCallback(async () => {
        try {
            const data = await KotService.listActive();
            setKots(data);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to fetch KOTs");
        } finally {
            setLoading(false);
        }
    }, [error]);

    // SSE: snapshot + refresh hint on each order event (item status flips fire orderEvents)
    useEffect(() => {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
        const es = new EventSource(`${API_BASE_URL}/kot/stream`, { withCredentials: true });

        es.addEventListener("snapshot", (e) => {
            try {
                const data = JSON.parse(e.data);
                setKots(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch {}
        });
        es.addEventListener("refresh", () => {
            fetchKots();
        });
        es.onerror = () => fetchKots();

        return () => es.close();
    }, [fetchKots]);

    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 60000);
        return () => clearInterval(t);
    }, []);

    const visibleKots = useMemo(
        () =>
            [...kots]
                .filter((k) => !isCardDone(k))
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        [kots],
    );

    // Find live status for a KOT item using the snapshot's orderItemId → live OrderItem.status
    const itemStatusFor = (kot: KotDTO, orderItemId: string): OrderItemStatus => {
        const live = (kot.order?.orderItems ?? []).find((oi) => oi.id === orderItemId);
        return (live?.status ?? "PENDING") as OrderItemStatus;
    };

    const flipItem = async (orderItemId: string, next: OrderItemStatus) => {
        setPendingItem(orderItemId);
        try {
            await OrderService.updateItemStatus(orderItemId, next);
            // SSE will broadcast; optimistic update keeps UI snappy
            setKots((prev) =>
                prev.map((k) => {
                    const items = k.order?.orderItems;
                    if (!items?.some((oi) => oi.id === orderItemId)) return k;
                    return {
                        ...k,
                        order: {
                            ...k.order!,
                            orderItems: items.map((oi) =>
                                oi.id === orderItemId ? { ...oi, status: next } : oi,
                            ),
                        },
                    };
                }),
            );
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to update item");
        } finally {
            setPendingItem(null);
        }
    };

    const bumpAllReady = async (kot: KotDTO) => {
        const itemsToFlip = (kot.order?.orderItems ?? []).filter((oi) => oi.status === "PENDING");
        for (const it of itemsToFlip) {
            await OrderService.updateItemStatus(it.id, "READY").catch(() => {});
        }
        success(`KOT #${kot.kotNumber}: all items ready`);
        fetchKots();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-gray-700" />
                    <h2 className="text-xl font-semibold">Kitchen Display</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchKots} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {visibleKots.length} active
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setIs86Open(true)}
                >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    86 Items
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading KOTs...
                </div>
            ) : visibleKots.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">
                    No active KOTs. New orders will appear here.
                </div>
            ) : null}

            <EightySixSheet shopId={shopId} open={is86Open} onOpenChange={setIs86Open} />

            {!loading && visibleKots.length > 0 && (
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {visibleKots.map((kot) => {
                            const mins = ageMinutes(kot.createdAt);
                            const tableNum = kot.order?.tableSession?.table?.tableNumber;
                            const time = new Date(kot.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            const pendingCount = (kot.order?.orderItems ?? []).filter((oi) => oi.status === "PENDING").length;

                            return (
                                <div
                                    key={kot.id}
                                    className={`border-2 rounded-xl overflow-hidden flex flex-col ${ageColor(mins)}`}
                                >
                                    <div className="px-3 py-2 flex items-center justify-between border-b bg-white">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">KOT #{kot.kotNumber}</span>
                                            {kot.isSupplementary && (
                                                <span className="text-[9px] uppercase font-bold tracking-wide bg-black text-white px-1.5 py-0.5 rounded">
                                                    SUPP
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ageBadge(mins)}`}>
                                            {mins}m
                                        </span>
                                    </div>

                                    <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-600 border-b bg-white">
                                        <span className="font-semibold">
                                            {tableNum ? `Table ${tableNum}` : kot.order?.orderType ?? "Order"}
                                        </span>
                                        <span>{time}</span>
                                    </div>

                                    <div className="px-3 py-3 flex-1 space-y-2">
                                        {kot.items.map((item, i) => {
                                            const status = itemStatusFor(kot, item.orderItemId);
                                            const style = statusStyles[status];
                                            const isPending = pendingItem === item.orderItemId;
                                            const canMarkReady = status === "PENDING" || status === "HOLD";
                                            const canMarkServed = status === "READY";
                                            const canHold = status === "PENDING";
                                            const canVoid = status !== "VOID";
                                            const canUndo = status === "READY" || status === "SERVED";

                                            return (
                                                <div key={i} className={`text-sm ${style.row}`}>
                                                    <div className="flex items-start gap-1.5">
                                                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div>
                                                                <span className="font-bold text-base mr-2">{item.quantity}×</span>
                                                                <span className="font-medium text-gray-900">{item.name}</span>
                                                                {item.variantName && (
                                                                    <span className="text-gray-500"> · {item.variantName}</span>
                                                                )}
                                                            </div>
                                                            {item.addons.length > 0 && (
                                                                <p className="text-[11px] text-gray-500 pl-1">
                                                                    + {item.addons.map((a) => a.name).join(", ")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Per-item actions */}
                                                    <div className="flex gap-1 mt-1.5 pl-3.5 flex-wrap">
                                                        {canMarkReady && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 px-2 text-[10px] font-semibold border-amber-300 text-amber-700 hover:bg-amber-50"
                                                                disabled={isPending}
                                                                onClick={() => flipItem(item.orderItemId, "READY")}
                                                            >
                                                                <Check className="h-3 w-3 mr-0.5" />Ready
                                                            </Button>
                                                        )}
                                                        {canMarkServed && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 px-2 text-[10px] font-semibold border-green-300 text-green-700 hover:bg-green-50"
                                                                disabled={isPending}
                                                                onClick={() => flipItem(item.orderItemId, "SERVED")}
                                                            >
                                                                <CheckCheck className="h-3 w-3 mr-0.5" />Served
                                                            </Button>
                                                        )}
                                                        {canHold && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                                                                disabled={isPending}
                                                                onClick={() => flipItem(item.orderItemId, "HOLD")}
                                                            >
                                                                <Pause className="h-3 w-3 mr-0.5" />Hold
                                                            </Button>
                                                        )}
                                                        {canUndo && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[10px] text-gray-500 hover:bg-gray-100"
                                                                disabled={isPending}
                                                                onClick={() => flipItem(item.orderItemId, "PENDING")}
                                                            >
                                                                <Undo2 className="h-3 w-3 mr-0.5" />Undo
                                                            </Button>
                                                        )}
                                                        {canVoid && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[10px] text-red-500 hover:bg-red-50"
                                                                disabled={isPending}
                                                                onClick={() => flipItem(item.orderItemId, "VOID")}
                                                            >
                                                                <X className="h-3 w-3 mr-0.5" />Void
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Card footer */}
                                    <div className="px-3 py-2 border-t bg-white flex items-center justify-between gap-2">
                                        {pendingCount > 0 ? (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                                onClick={() => bumpAllReady(kot)}
                                            >
                                                Mark all ready ({pendingCount})
                                            </Button>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 flex-1">
                                                {kot.printedAt ? `Printed ${kot.printCount}×` : "Not printed"}
                                            </span>
                                        )}
                                        <Link
                                            href={`/dashboard/${shopId}/kot/${kot.id}/print`}
                                            target="_blank"
                                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                                        >
                                            <Printer className="h-3 w-3" />
                                            Reprint
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
