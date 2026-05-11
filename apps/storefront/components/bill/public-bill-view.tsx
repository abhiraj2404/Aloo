"use client";

import type { ReceiptDTO } from "@repo/api-sdk";
import { Button } from "@repo/ui/components/button";
import { Printer } from "lucide-react";

const inRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

const statusStyles: Record<string, { label: string; cls: string }> = {
    GENERATED: { label: "Unpaid", cls: "bg-amber-100 text-amber-700" },
    PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-orange-100 text-orange-700" },
    PAID: { label: "Paid", cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

export function PublicBillView({ receipt }: { receipt: ReceiptDTO }) {
    const status = statusStyles[receipt.status] ?? statusStyles.GENERATED;
    const date = new Date(receipt.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
            <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg overflow-hidden print:shadow-none print:rounded-none">
                <div className="px-6 py-5 border-b border-gray-100 text-center">
                    <h1 className="text-xl font-bold text-gray-900">{receipt.shopName}</h1>
                    <p className="text-xs text-gray-500 mt-1">{receipt.shopAddress}</p>
                    {receipt.gstNumber && (
                        <p className="text-xs text-gray-500 mt-1">GSTIN: {receipt.gstNumber}</p>
                    )}
                </div>

                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between text-sm">
                    <div>
                        <p className="font-mono font-semibold text-gray-900">{receipt.billNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                        {receipt.tableName && (
                            <p className="text-xs text-gray-500">
                                {receipt.tableName}
                                {receipt.pax ? ` · ${receipt.pax} pax` : ""}
                            </p>
                        )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status?.cls}`}>
                        {status?.label}
                    </span>
                </div>

                {receipt.customer && (
                    <div className="px-6 py-3 border-b border-gray-100 text-sm">
                        <p className="text-xs text-gray-500">Bill to</p>
                        <p className="font-medium text-gray-900">
                            {receipt.customer.name ?? "Customer"} <span className="text-gray-500">• {receipt.customer.phone}</span>
                        </p>
                    </div>
                )}

                <div className="px-6 py-4 space-y-1.5">
                    {receipt.items.map((it, idx) => (
                        <div key={idx} className="flex items-start justify-between text-sm">
                            <div className="flex-1 pr-3">
                                <p className="text-gray-900">
                                    {it.name}
                                    {it.variantName && <span className="text-gray-500 font-normal"> · {it.variantName}</span>}
                                </p>
                                {it.addons && it.addons.length > 0 && (
                                    <p className="text-[11px] text-gray-500">+ {it.addons.map((a) => a.name).join(", ")}</p>
                                )}
                                <p className="text-xs text-gray-500">{it.quantity} × {inRupees(it.price)}</p>
                            </div>
                            <p className="text-gray-900 tabular-nums">{inRupees(it.total)}</p>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm space-y-1">
                    <Row label="Subtotal" value={inRupees(receipt.subtotal)} />
                    {receipt.discountAmount > 0 && (
                        <Row label="Discount" value={`- ${inRupees(receipt.discountAmount)}`} valueClass="text-green-600" />
                    )}
                    {receipt.cgstAmount > 0 && <Row label="CGST" value={inRupees(receipt.cgstAmount)} />}
                    {receipt.sgstAmount > 0 && <Row label="SGST" value={inRupees(receipt.sgstAmount)} />}
                    {receipt.serviceChargeAmount > 0 && <Row label="Service Charge" value={inRupees(receipt.serviceChargeAmount)} />}
                    {receipt.roundOff !== 0 && (
                        <Row label="Round Off" value={(receipt.roundOff > 0 ? "+ " : "- ") + inRupees(Math.abs(receipt.roundOff))} />
                    )}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 font-bold text-base">
                        <span>Total</span>
                        <span className="tabular-nums">{inRupees(receipt.totalAmount)}</span>
                    </div>
                    {receipt.paidAmount > 0 && (
                        <Row label="Paid" value={inRupees(receipt.paidAmount)} />
                    )}
                    {receipt.balance > 0 && (
                        <Row label="Balance" value={inRupees(receipt.balance)} valueClass="text-red-600 font-semibold" />
                    )}
                </div>

                {receipt.payments.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
                        <p className="font-medium text-gray-700 mb-1">Payments</p>
                        {receipt.payments.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span>{p.mode}{p.reference ? ` • ${p.reference}` : ""}</span>
                                <span className="tabular-nums">{inRupees(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-6 py-5 text-center">
                    <p className="text-xs text-gray-400">Thank you for visiting!</p>
                </div>
            </div>

            <div className="max-w-md mx-auto mt-4 px-2 print:hidden">
                <Button onClick={() => window.print()} variant="outline" className="w-full">
                    <Printer className="h-4 w-4 mr-2" />
                    Save / Print
                </Button>
            </div>
        </div>
    );
}

const Row = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-600">{label}</span>
        <span className={`tabular-nums ${valueClass ?? "text-gray-900"}`}>{value}</span>
    </div>
);
