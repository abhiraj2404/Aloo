"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { BillService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

const paymentModes = ["CASH", "CARD", "UPI", "WALLET", "OTHER"] as const;
type Mode = (typeof paymentModes)[number];

// Three-click settlement: open popover, optionally change mode/amount, hit Settle.
// Defaults to CASH for the full balance — the most common cashier flow.
export function QuickSettlePopover({
    billId,
    balance,
    onSettled,
    className,
}: {
    billId: string;
    balance: number;     // paise
    onSettled: () => void;
    className?: string;
}) {
    const { success, error } = useToast();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("CASH");
    const [amount, setAmount] = useState((balance / 100).toFixed(2));
    const [reference, setReference] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Reset to the latest balance whenever the popover opens
    useEffect(() => {
        if (open) {
            setAmount((balance / 100).toFixed(2));
            setReference("");
            setMode("CASH");
        }
    }, [open, balance]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, [open]);

    const handleSettle = async () => {
        const paise = Math.round(parseFloat(amount || "0") * 100);
        if (paise <= 0) { error("Enter a valid amount"); return; }
        if (paise > balance) { error("Amount exceeds balance"); return; }

        setSubmitting(true);
        try {
            await BillService.recordPayment(billId, {
                mode,
                amount: paise,
                reference: reference.trim() || undefined,
            });
            success(paise === balance ? "Bill settled" : "Payment recorded");
            setOpen(false);
            onSettled();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to record payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className ?? ""}`} onClick={(e) => e.stopPropagation()}>
            <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => setOpen((o) => !o)}
            >
                <CreditCard className="h-3 w-3 mr-1" />
                Settle
            </Button>

            {open && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-white border rounded-lg shadow-lg z-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">Quick Settle</p>
                        <p className="text-xs text-gray-500 tabular-nums">
                            Balance ₹{(balance / 100).toFixed(2)}
                        </p>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                        {paymentModes.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`h-7 text-[10px] font-semibold rounded border transition-colors ${
                                    mode === m
                                        ? "bg-red-500 text-white border-red-500"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount"
                            className="h-8 text-xs flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => setAmount((balance / 100).toFixed(2))}
                            className="text-[10px] font-semibold text-blue-600 hover:underline whitespace-nowrap"
                        >
                            Full
                        </button>
                    </div>

                    {(mode === "UPI" || mode === "CARD") && (
                        <Input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Reference (optional)"
                            className="h-8 text-xs"
                        />
                    )}

                    <Button
                        className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                        onClick={handleSettle}
                        disabled={submitting}
                    >
                        {submitting
                            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            : null}
                        Record {mode}
                    </Button>
                </div>
            )}
        </div>
    );
}
