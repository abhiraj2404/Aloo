"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { OrderService } from "@repo/api-sdk";
import { getStoredOrderIds } from "@/lib/order-store";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderData {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderItems: { id: string; name: string; price: number; quantity: number }[];
}

interface OrderTrackerProps {
    shopId: string;
    tableNumber: number;
    refreshKey: number;
}

export const OrderTracker = ({ shopId, tableNumber, refreshKey }: OrderTrackerProps) => {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        const ids = getStoredOrderIds(shopId, tableNumber);
        if (ids.length === 0) {
            setOrders([]);
            return;
        }

        const results = await Promise.allSettled(
            ids.map((id) => OrderService.getOrderById(id))
        );

        const fetched: OrderData[] = [];
        results.forEach((r) => {
            if (r.status === "fulfilled" && r.value) fetched.push(r.value);
        });

        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(fetched);
    }, [shopId, tableNumber]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders, refreshKey]);

    useEffect(() => {
        const hasActive = orders.some(
            (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
        );
        if (!hasActive) return;

        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [orders, fetchOrders]);

    if (orders.length === 0) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 pt-4">
            <div className="bg-[#f8f7f4] rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#594a4e]" />
                    <h3 className="text-sm font-semibold text-[#33272a]">Your Orders</h3>
                    <span className="text-xs text-[#594a4e] bg-white px-2 py-0.5 rounded-full">{orders.length}</span>
                </div>

                <div className="px-4 pb-3 space-y-2">
                    {orders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const totalInRupees = Math.round(order.totalAmount / 100);
                        const time = new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                        });

                        return (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className="w-full flex items-center justify-between px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-[#33272a] text-left">
                                                {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"} • ₹{totalInRupees}
                                            </p>
                                            <p className="text-xs text-[#594a4e]">{time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <OrderStatusBadge status={order.status} />
                                        {isExpanded
                                            ? <ChevronUp className="h-4 w-4 text-[#594a4e]" />
                                            : <ChevronDown className="h-4 w-4 text-[#594a4e]" />
                                        }
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-3 border-t border-gray-100">
                                        <div className="pt-2 space-y-1.5">
                                            {order.orderItems.map((oi) => (
                                                <div key={oi.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-[#33272a]">
                                                        {oi.name} × {oi.quantity}
                                                    </span>
                                                    <span className="text-[#594a4e]">
                                                        ₹{Math.round((oi.price * oi.quantity) / 100)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
