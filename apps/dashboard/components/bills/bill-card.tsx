"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDown, ChevronUp, Clock, IndianRupee } from "lucide-react";
import { BillService } from "@repo/api-sdk";
import { useState } from "react";
import { useToast } from "@/lib/use-toast";

interface BillOrder {
    id: string;
    totalAmount: number;
    status: string;
    orderItems: { id: string; name: string; price: number; quantity: number }[];
}

interface BillData {
    id: string;
    status: string;
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    createdAt: string;
    tableSession: {
        table: { tableNumber: number };
        orders: BillOrder[];
    };
}

const statusStyles: Record<string, { label: string; className: string }> = {
    GENERATED: { label: "Unpaid", className: "bg-amber-100 text-amber-700" },
    PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function BillCard({ bill, onUpdate }: { bill: BillData; onUpdate: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { success, error } = useToast();

    const totalInRupees = Math.round(bill.totalAmount / 100);
    const tableNumber = bill.tableSession?.table?.tableNumber;
    const style = statusStyles[bill.status] || statusStyles.GENERATED;
    const time = new Date(bill.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const date = new Date(bill.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    });

    const handleMarkPaid = async () => {
        setIsUpdating(true);
        try {
            await BillService.updateBillStatus(bill.id, "PAID");
            success(`Bill for Table ${tableNumber} marked as paid`);
            onUpdate();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to mark bill as paid";
            error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        setIsUpdating(true);
        try {
            await BillService.updateBillStatus(bill.id, "CANCELLED");
            success(`Bill for Table ${tableNumber} cancelled`);
            onUpdate();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to cancel bill";
            error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const allItems = bill.tableSession?.orders?.flatMap((o) => o.orderItems) ?? [];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">{tableNumber}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Table {tableNumber}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {date}, {time}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style?.className}`}>
                        {style?.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">₹{totalInRupees}</span>
                    {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100">
                    <div className="px-4 py-3 space-y-1">
                        {allItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                <span className="text-gray-400">₹{Math.round((item.price * item.quantity) / 100)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">₹{Math.round(bill.subtotal / 100)}</span>
                        </div>
                        {bill.tax > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Tax</span>
                                <span className="text-gray-900">₹{Math.round(bill.tax / 100)}</span>
                            </div>
                        )}
                        {bill.discount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Discount</span>
                                <span className="text-green-600">-₹{Math.round(bill.discount / 100)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-bold mt-1 pt-1 border-t border-gray-200">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">₹{totalInRupees}</span>
                        </div>
                    </div>

                    {bill.status === "GENERATED" && (
                        <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={handleCancel}
                                disabled={isUpdating}
                            >
                                Cancel Bill
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handleMarkPaid}
                                disabled={isUpdating}
                            >
                                <IndianRupee className="h-3.5 w-3.5 mr-1" />
                                {isUpdating ? "Processing..." : "Mark as Paid"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
