"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { OrderService, BillService } from "@repo/api-sdk";
import { TableOrderGroup } from "./order-card";
import { useToast } from "@/lib/use-toast";

interface OrderItem {
    id: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    variantName?: string | null;
    addons?: { name: string; price: number }[] | null;
}

interface OrderData {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    tableSessionId: string | null;
    tableSession?: { id: string; table?: { tableNumber: number } } | null;
    orderItems: OrderItem[];
    customer?: { id: string; phone: string; name: string | null } | null;
}

interface TableGroup {
    tableNumber: number | null;
    tableSessionId: string | null;
    orders: OrderData[];
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PREPARING", label: "Preparing" },
    { value: "COMPLETED", label: "Served" },
    { value: "CANCELLED", label: "Cancelled" },
] as const;

export function OrdersView({ shopId }: { shopId: string }) {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const { success, error } = useToast();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const result = await OrderService.getAllOrders();
            setOrders(Array.isArray(result) ? result : []);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to fetch orders";
            error(msg);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
        const es = new EventSource(`${API_BASE_URL}/order/stream`, { withCredentials: true });

        es.addEventListener("snapshot", (e) => {
            try {
                const data = JSON.parse(e.data);
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch {}
        });

        es.addEventListener("created", (e) => {
            try {
                const { order } = JSON.parse(e.data);
                setOrders((prev) => [order, ...prev]);
            } catch {}
        });

        es.addEventListener("updated", (e) => {
            try {
                const { order } = JSON.parse(e.data);
                setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
            } catch {}
        });

        es.addEventListener("deleted", (e) => {
            try {
                const { orderId } = JSON.parse(e.data);
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
            } catch {}
        });

        es.onerror = () => {
            // EventSource auto-reconnects; fall back to a manual fetch on error
            fetchOrders();
        };

        return () => es.close();
    }, [fetchOrders]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: orders.length };
        orders.forEach((o) => {
            counts[o.status] = (counts[o.status] || 0) + 1;
        });
        return counts;
    }, [orders]);

    const filteredOrders = useMemo(() => {
        let result = orders;

        if (activeTab !== "all") {
            result = result.filter((o) => o.status === activeTab);
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter((o) => {
                const tableNum = o.tableSession?.table?.tableNumber;
                if (tableNum && `table ${tableNum}`.includes(q)) return true;
                return o.orderItems.some((oi) => oi.name.toLowerCase().includes(q));
            });
        }

        return result;
    }, [orders, activeTab, searchQuery]);

    const tableGroups = useMemo(() => {
        const groups = new Map<string, TableGroup>();

        filteredOrders.forEach((order) => {
            const key = order.tableSessionId || order.id;
            const existing = groups.get(key);
            if (existing) {
                existing.orders.push(order);
            } else {
                groups.set(key, {
                    tableNumber: order.tableSession?.table?.tableNumber ?? null,
                    tableSessionId: order.tableSessionId,
                    orders: [order],
                });
            }
        });

        return Array.from(groups.values()).sort((a, b) => {
            const aLatest = Math.max(...a.orders.map((o) => new Date(o.createdAt).getTime()));
            const bLatest = Math.max(...b.orders.map((o) => new Date(o.createdAt).getTime()));
            return bLatest - aLatest;
        });
    }, [filteredOrders]);

    const billableSessions = useMemo(() => {
        const sessions = new Map<string, { tableNumber: number; total: number }>();

        orders.forEach((o) => {
            if (!o.tableSessionId || !o.tableSession?.table) return;
            if (o.status === "CANCELLED") return;

            if (!sessions.has(o.tableSessionId)) {
                sessions.set(o.tableSessionId, {
                    tableNumber: o.tableSession.table.tableNumber,
                    total: 0,
                });
            }
            sessions.get(o.tableSessionId)!.total += o.totalAmount;
        });

        return Array.from(sessions.entries()).filter(([sessionId]) => {
            const sessionOrders = orders.filter((o) => o.tableSessionId === sessionId);
            return sessionOrders.every((o) => o.status === "COMPLETED" || o.status === "CANCELLED");
        });
    }, [orders]);

    const handleGenerateBill = async (tableSessionId: string) => {
        try {
            await BillService.generateBill(tableSessionId);
            success("Bill generated successfully");
            fetchOrders();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to generate bill";
            error(msg);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Orders</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchOrders}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                        {statusCounts.PENDING || 0} Pending
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {statusCounts.PREPARING || 0} Preparing
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto relative">
                    <TabsList className="w-full sm:w-auto flex overflow-x-auto justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {STATUS_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                                {tab.label}
                                {(statusCounts[tab.value] ?? 0) > 0 && (
                                    <span className="ml-1 text-[10px] bg-gray-200 rounded-full px-1.5">
                                        {statusCounts[tab.value]}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>


            <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4 pb-4">
                    {tableGroups.map((group) => {
                        const isBillable = group.tableSessionId
                            ? billableSessions.some(([sid]) => sid === group.tableSessionId)
                            : false;
                        return (
                            <TableOrderGroup
                                key={group.tableSessionId || group.orders[0]?.id}
                                shopId={shopId}
                                tableNumber={group.tableNumber}
                                orders={group.orders}
                                onStatusUpdate={fetchOrders}
                                isBillable={isBillable}
                                onGenerateBill={
                                    isBillable && group.tableSessionId
                                        ? () => handleGenerateBill(group.tableSessionId!)
                                        : undefined
                                }
                            />
                        );
                    })}
                </div>
                {tableGroups.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {orders.length === 0 ? "No orders yet" : "No orders match your filter"}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
