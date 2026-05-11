"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDown, ChevronUp, Clock, Eye } from "lucide-react";
import { useState } from "react";

interface BillOrder {
    id: string;
    totalAmount: number;
    status: string;
    orderItems: { id: string; name: string; price: number; quantity: number }[];
}

interface PaymentData {
    id: string;
    mode: string;
    amount: number;
    reference: string | null;
    notes: string | null;
    createdAt: string;
}

export interface BillData {
    id: string;
    billNumber: string;
    status: string;
    subtotal: number;
    discountType: string | null;
    discountValue: number;
    discountAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    roundOff: number;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
    cancelledReason: string | null;
    customer: { id: string; phone: string; name: string | null } | null;
    payments: PaymentData[];
    tableSession: {
        table: { tableNumber: number } | null;
        pax: number | null;
        orders: BillOrder[];
    };
}

const statusStyles: Record<string, { label: string; className: string }> = {
    GENERATED: { label: "Unpaid", className: "bg-amber-100 text-amber-700" },
    PARTIALLY_PAID: { label: "Partial", className: "bg-blue-100 text-blue-700" },
    PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function BillCard({ bill, onViewDetails }: { bill: BillData; onViewDetails: (bill: BillData) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

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

    const allItems = bill.tableSession?.orders?.flatMap((o) => o.orderItems) ?? [];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">{tableNumber ?? "—"}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{bill.billNumber}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {date}, {time}
                            {tableNumber && <span className="ml-1">• Table {tableNumber}</span>}
                        </p>
                        {bill.customer && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {bill.customer.name ?? "Customer"} · {bill.customer.phone}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style?.className}`}>
                        {style?.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{formatPaise(bill.totalAmount)}</span>
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
                                <span className="text-gray-400">{formatPaise(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">{formatPaise(bill.subtotal)}</span>
                        </div>
                        {bill.discountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Discount</span>
                                <span className="text-green-600">-{formatPaise(bill.discountAmount)}</span>
                            </div>
                        )}
                        {(bill.cgstAmount > 0 || bill.sgstAmount > 0) && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Tax (CGST + SGST)</span>
                                <span className="text-gray-900">{formatPaise(bill.cgstAmount + bill.sgstAmount)}</span>
                            </div>
                        )}
                        {bill.serviceChargeAmount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Service Charge</span>
                                <span className="text-gray-900">{formatPaise(bill.serviceChargeAmount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-bold mt-1 pt-1 border-t border-gray-200">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatPaise(bill.totalAmount)}</span>
                        </div>
                        {bill.paidAmount > 0 && bill.status !== "PAID" && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                                <span>Paid</span>
                                <span>{formatPaise(bill.paidAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
                        <Button
                            size="sm"
                            className="flex-1 bg-red-500 hover:bg-red-600"
                            onClick={() => onViewDetails(bill)}
                        >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
