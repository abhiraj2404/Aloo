"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@repo/ui/components/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Loader2, Printer, X, Plus, Clock, CreditCard, History } from "lucide-react";
import { BillService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

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

interface BillDetailData {
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
    payments: PaymentData[];
    tableSession: {
        table: { tableNumber: number } | null;
        orders: BillOrder[];
    };
}

interface AuditEntry {
    id: string;
    action: string;
    createdAt: string;
    metadata: any;
    user: { name: string; email: string } | null;
}

const statusStyles: Record<string, { label: string; className: string }> = {
    GENERATED: { label: "Unpaid", className: "bg-amber-100 text-amber-700" },
    PARTIALLY_PAID: { label: "Partial", className: "bg-blue-100 text-blue-700" },
    PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const paymentModes = ["CASH", "CARD", "UPI", "WALLET", "OTHER"] as const;

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

type ActiveTab = "details" | "payments" | "audit";

export function BillDetailDialog({
    bill,
    open,
    onOpenChange,
    onUpdate,
}: {
    bill: BillDetailData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}) {
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState<ActiveTab>("details");
    const [audit, setAudit] = useState<AuditEntry[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Payment form state
    const [payMode, setPayMode] = useState<string>("CASH");
    const [payAmount, setPayAmount] = useState("");
    const [payRef, setPayRef] = useState("");
    const [payNotes, setPayNotes] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    // Discount form state
    const [showDiscount, setShowDiscount] = useState(false);
    const [discType, setDiscType] = useState<string>("PERCENT");
    const [discValue, setDiscValue] = useState("");
    const [isApplyingDisc, setIsApplyingDisc] = useState(false);

    // Cancel form state
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const balance = bill.totalAmount - bill.paidAmount;
    const style = statusStyles[bill.status] || statusStyles.GENERATED;
    const tableNum = bill.tableSession?.table?.tableNumber;
    const allItems = bill.tableSession?.orders?.flatMap((o) => o.orderItems) ?? [];
    const canModify = bill.status === "GENERATED" || bill.status === "PARTIALLY_PAID";

    const fetchAudit = useCallback(async () => {
        setAuditLoading(true);
        try {
            const data = await BillService.getAudit(bill.id);
            setAudit(Array.isArray(data) ? data : []);
        } catch {
            setAudit([]);
        } finally {
            setAuditLoading(false);
        }
    }, [bill.id]);

    useEffect(() => {
        if (activeTab === "audit" && audit.length === 0) {
            fetchAudit();
        }
    }, [activeTab, fetchAudit, audit.length]);

    const handleRecordPayment = async () => {
        const amount = Math.round(parseFloat(payAmount || "0") * 100);
        if (amount <= 0) { error("Enter a valid amount"); return; }

        setIsRecording(true);
        try {
            await BillService.recordPayment(bill.id, {
                mode: payMode,
                amount,
                reference: payRef.trim() || undefined,
                notes: payNotes.trim() || undefined,
            });
            success("Payment recorded");
            setPayAmount("");
            setPayRef("");
            setPayNotes("");
            onUpdate();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to record payment");
        } finally {
            setIsRecording(false);
        }
    };

    const handleApplyDiscount = async () => {
        const value = discType === "PERCENT"
            ? Math.round(parseFloat(discValue || "0") * 100) // % → basis points
            : Math.round(parseFloat(discValue || "0") * 100); // ₹ → paise

        if (value <= 0) { error("Enter a valid value"); return; }

        setIsApplyingDisc(true);
        try {
            await BillService.applyDiscount(bill.id, {
                type: discType as "PERCENT" | "FLAT",
                value,
            });
            success("Discount applied");
            setShowDiscount(false);
            setDiscValue("");
            onUpdate();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to apply discount");
        } finally {
            setIsApplyingDisc(false);
        }
    };

    const handleClearDiscount = async () => {
        setIsApplyingDisc(true);
        try {
            await BillService.clearDiscount(bill.id);
            success("Discount cleared");
            setShowDiscount(false);
            onUpdate();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to clear discount");
        } finally {
            setIsApplyingDisc(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) { error("Enter a reason"); return; }

        setIsCancelling(true);
        try {
            await BillService.cancelBill(bill.id, cancelReason.trim());
            success("Bill cancelled");
            setShowCancel(false);
            onUpdate();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to cancel bill");
        } finally {
            setIsCancelling(false);
        }
    };

    const handlePrint = () => {
        // Open receipt in a new window
        const currentUrl = window.location.pathname;
        const parts = currentUrl.split("/");
        const shopId = parts[parts.indexOf("dashboard") + 1];
        if (shopId) {
            window.open(`/dashboard/${shopId}/receipt/${bill.id}`, "_blank");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogTitle className="sr-only">Bill Details</DialogTitle>

                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{bill.billNumber}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${style?.className ?? ""}`}>
                                {style?.label ?? bill.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {tableNum ? `Table ${tableNum}` : "No table"} •{" "}
                            {new Date(bill.createdAt).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b flex gap-1">
                    {([
                        { key: "details", label: "Details", icon: CreditCard },
                        { key: "payments", label: "Payments", icon: Plus },
                        { key: "audit", label: "Audit Log", icon: History },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === key
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <ScrollArea className="flex-1 max-h-[60vh]">
                    {activeTab === "details" && (
                        <div className="px-6 py-4 space-y-4">
                            {/* Items */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</h4>
                                <div className="space-y-1">
                                    {allItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                            <span className="text-gray-500">{formatPaise(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Charges Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">{formatPaise(bill.subtotal)}</span>
                                </div>
                                {bill.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Discount {bill.discountType === "PERCENT" ? `(${(bill.discountValue / 100).toFixed(2)}%)` : ""}
                                        </span>
                                        <span className="text-green-600">-{formatPaise(bill.discountAmount)}</span>
                                    </div>
                                )}
                                {bill.cgstAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">CGST</span>
                                        <span className="text-gray-900">{formatPaise(bill.cgstAmount)}</span>
                                    </div>
                                )}
                                {bill.sgstAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">SGST</span>
                                        <span className="text-gray-900">{formatPaise(bill.sgstAmount)}</span>
                                    </div>
                                )}
                                {bill.serviceChargeAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service Charge</span>
                                        <span className="text-gray-900">{formatPaise(bill.serviceChargeAmount)}</span>
                                    </div>
                                )}
                                {bill.roundOff !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Round Off</span>
                                        <span className="text-gray-900">{bill.roundOff > 0 ? "+" : ""}{formatPaise(bill.roundOff)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>{formatPaise(bill.totalAmount)}</span>
                                </div>
                                {bill.paidAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Paid</span>
                                        <span className="text-green-600">{formatPaise(bill.paidAmount)}</span>
                                    </div>
                                )}
                                {balance > 0 && bill.status !== "CANCELLED" && (
                                    <div className="flex justify-between text-sm font-semibold text-amber-600">
                                        <span>Balance</span>
                                        <span>{formatPaise(balance)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Discount controls */}
                            {canModify && (
                                <div>
                                    {!showDiscount ? (
                                        <Button variant="outline" size="sm" onClick={() => setShowDiscount(true)}>
                                            {bill.discountAmount > 0 ? "Edit Discount" : "Add Discount"}
                                        </Button>
                                    ) : (
                                        <div className="border rounded-lg p-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Select value={discType} onValueChange={setDiscType}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PERCENT">Percent (%)</SelectItem>
                                                        <SelectItem value="FLAT">Flat (₹)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    placeholder={discType === "PERCENT" ? "e.g. 10" : "e.g. 50"}
                                                    value={discValue}
                                                    onChange={(e) => setDiscValue(e.target.value)}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={handleApplyDiscount} disabled={isApplyingDisc}>
                                                    {isApplyingDisc ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                    Apply
                                                </Button>
                                                {bill.discountAmount > 0 && (
                                                    <Button size="sm" variant="outline" onClick={handleClearDiscount} disabled={isApplyingDisc}>
                                                        Clear Discount
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => setShowDiscount(false)}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {bill.cancelledReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-red-700">Cancellation Reason</p>
                                    <p className="text-sm text-red-600 mt-1">{bill.cancelledReason}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div className="px-6 py-4 space-y-4">
                            {/* Existing payments */}
                            {bill.payments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Recorded Payments
                                    </h4>
                                    <div className="space-y-2">
                                        {bill.payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                                <div>
                                                    <span className="font-medium">{p.mode}</span>
                                                    {p.reference && (
                                                        <span className="text-gray-400 ml-2 text-xs">Ref: {p.reference}</span>
                                                    )}
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(p.createdAt).toLocaleString("en-IN", {
                                                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="font-semibold text-green-600">{formatPaise(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Record new payment */}
                            {canModify && balance > 0 && (
                                <div className="border rounded-lg p-4 space-y-3">
                                    <h4 className="text-sm font-semibold">Record Payment</h4>
                                    <p className="text-xs text-gray-500">Balance: {formatPaise(balance)}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Mode</Label>
                                            <Select value={payMode} onValueChange={setPayMode}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentModes.map((m) => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={`Max ${(balance / 100).toFixed(2)}`}
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Reference (optional)</Label>
                                            <Input
                                                placeholder="Txn ID"
                                                value={payRef}
                                                onChange={(e) => setPayRef(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Notes (optional)</Label>
                                            <Input
                                                placeholder="Notes"
                                                value={payNotes}
                                                onChange={(e) => setPayNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={handleRecordPayment}
                                        disabled={isRecording || !payAmount}
                                    >
                                        {isRecording ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Record Payment
                                    </Button>
                                </div>
                            )}

                            {bill.status === "PAID" && (
                                <div className="text-center py-4 text-green-600 font-medium text-sm">
                                    ✓ Bill is fully paid
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "audit" && (
                        <div className="px-6 py-4">
                            {auditLoading ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Loading audit log...
                                </div>
                            ) : audit.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">No audit entries</div>
                            ) : (
                                <div className="space-y-2">
                                    {audit.map((entry) => (
                                        <div key={entry.id} className="flex gap-3 text-sm">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5" />
                                                <div className="w-px flex-1 bg-gray-200" />
                                            </div>
                                            <div className="pb-3">
                                                <p className="font-medium text-gray-900">
                                                    {entry.action.replace("BILL_", "").replace(/_/g, " ")}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.user?.name || entry.user?.email || "System"} •{" "}
                                                    {new Date(entry.createdAt).toLocaleString("en-IN", {
                                                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {canModify && !showCancel && (
                    <div className="px-6 py-3 border-t flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setShowCancel(true)}
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel Bill
                        </Button>
                    </div>
                )}

                {showCancel && (
                    <div className="px-6 py-3 border-t space-y-2">
                        <Label className="text-sm">Cancellation Reason</Label>
                        <Input
                            placeholder="Reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setShowCancel(false)}>
                                Back
                            </Button>
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={handleCancel}
                                disabled={isCancelling || !cancelReason.trim()}
                            >
                                {isCancelling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Confirm Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
