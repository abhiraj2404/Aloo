"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronRight, Clock, Pencil, Trash2 } from "lucide-react";
import { OrderService } from "@repo/api-sdk";
import { useState } from "react";
import { useToast } from "@/lib/use-toast";
import { EditOrderDialog } from "./edit-order-dialog";

interface OrderItem {
    id: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}

interface OrderData {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    orderItems: OrderItem[];
}

interface TableOrderGroupProps {
    shopId: string;
    tableNumber: number | null;
    orders: OrderData[];
    onStatusUpdate: () => void;
}

const statusStyles: Record<string, { label: string; className: string }> = {
    PENDING:   { label: "Pending",   className: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
    PREPARING: { label: "Preparing", className: "bg-purple-100 text-purple-700" },
    COMPLETED: { label: "Served",    className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const nextStatus: Record<string, { next: string; label: string }> = {
    PENDING:   { next: "CONFIRMED", label: "Confirm" },
    CONFIRMED: { next: "PREPARING", label: "Start Preparing" },
    PREPARING: { next: "COMPLETED", label: "Mark Served" },
};

function StatusBadge({ status }: { status: string }) {
    const style = statusStyles[status] || statusStyles.PENDING;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${style?.className}`}>
            {style?.label}
        </span>
    );
}

function OrderRow({ order, shopId, onStatusUpdate }: { order: OrderData; shopId: string; onStatusUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const { success, error } = useToast();
    const next = nextStatus[order.status];
    const totalInRupees = Math.round(order.totalAmount / 100);
    const time = new Date(order.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const canEdit = order.status === "PENDING" || order.status === "CONFIRMED";
    const canDelete = order.status === "PENDING";

    const handleAdvance = async () => {
        if (!next) return;
        setIsUpdating(true);
        try {
            await OrderService.updateOrderStatus(order.id, next.next);
            success(`Order moved to ${next.label}`);
            onStatusUpdate();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to update order";
            error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        setIsUpdating(true);
        try {
            await OrderService.updateOrderStatus(order.id, "CANCELLED");
            success("Order cancelled");
            onStatusUpdate();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to cancel order";
            error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await OrderService.deleteOrder(order.id);
            success("Order deleted");
            onStatusUpdate();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to delete order";
            error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">₹{totalInRupees}</span>
                    {/* Edit & Delete icons for editable orders */}
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-blue-600"
                            onClick={() => setIsEditOpen(true)}
                            disabled={isUpdating}
                            title="Edit items"
                        >
                            <Pencil className="h-3 w-3" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-600"
                            onClick={handleDelete}
                            disabled={isDeleting || isUpdating}
                            title="Delete order"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-0.5 mb-2">
                {order.orderItems.map((oi) => (
                    <div key={oi.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{oi.name} × {oi.quantity}</span>
                        <span className="text-gray-400">₹{Math.round((oi.price * oi.quantity) / 100)}</span>
                    </div>
                ))}
            </div>

            {next && (
                <div className="flex gap-2">
                    {order.status === "PENDING" && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs"
                            onClick={handleCancel}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={handleAdvance}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "..." : next.label}
                        {!isUpdating && <ChevronRight className="h-3 w-3 ml-1" />}
                    </Button>
                </div>
            )}

            {/* Edit Order Dialog */}
            <EditOrderDialog
                shopId={shopId}
                orderId={order.id}
                currentItems={order.orderItems}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={onStatusUpdate}
            />
        </div>
    );
}

export function TableOrderGroup({ shopId, tableNumber, orders, onStatusUpdate }: TableOrderGroupProps) {
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalInRupees = Math.round(totalAmount / 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                        {tableNumber ? `Table ${tableNumber}` : "Online Order"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {orders.length} {orders.length === 1 ? "order" : "orders"}
                    </span>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{totalInRupees}</span>
            </div>

            <div className="px-4 py-3 space-y-3">
                {orders.map((order) => (
                    <OrderRow key={order.id} order={order} shopId={shopId} onStatusUpdate={onStatusUpdate} />
                ))}
            </div>
        </div>
    );
}
