"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { type BillData } from "./bill-card";
import { QuickSettlePopover } from "./quick-settle-popover";

type SortKey = "createdAt" | "billNumber" | "table" | "total" | "balance" | "status";
type SortDir = "asc" | "desc";

const statusStyles: Record<string, { label: string; className: string }> = {
    GENERATED: { label: "Unpaid", className: "bg-amber-100 text-amber-700" },
    PARTIALLY_PAID: { label: "Partial", className: "bg-blue-100 text-blue-700" },
    PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

const compare = (a: BillData, b: BillData, key: SortKey): number => {
    switch (key) {
        case "createdAt":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "billNumber":
            return a.billNumber.localeCompare(b.billNumber);
        case "table": {
            const ta = a.tableSession?.table?.tableNumber ?? 0;
            const tb = b.tableSession?.table?.tableNumber ?? 0;
            return ta - tb;
        }
        case "total":
            return a.totalAmount - b.totalAmount;
        case "balance":
            return (a.totalAmount - a.paidAmount) - (b.totalAmount - b.paidAmount);
        case "status":
            return a.status.localeCompare(b.status);
    }
};

function SortHeader({
    label,
    sortKey,
    currentKey,
    dir,
    onChange,
    align = "left",
}: {
    label: string;
    sortKey: SortKey;
    currentKey: SortKey;
    dir: SortDir;
    onChange: (key: SortKey) => void;
    align?: "left" | "right";
}) {
    const Icon = currentKey !== sortKey ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <button
            type="button"
            onClick={() => onChange(sortKey)}
            className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-800 w-full ${
                align === "right" ? "justify-end" : "justify-start"
            }`}
        >
            {label}
            <Icon className={`h-3 w-3 ${currentKey === sortKey ? "text-gray-800" : "text-gray-300"}`} />
        </button>
    );
}

export function BillsTable({
    bills,
    onViewDetails,
    onUpdate,
}: {
    bills: BillData[];
    onViewDetails: (bill: BillData) => void;
    onUpdate: () => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "createdAt" || key === "total" || key === "balance" ? "desc" : "asc");
        }
    };

    const sorted = useMemo(() => {
        const arr = [...bills];
        arr.sort((a, b) => compare(a, b, sortKey) * (sortDir === "asc" ? 1 : -1));
        return arr;
    }, [bills, sortKey, sortDir]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <div className="min-w-205">
            <div className="grid grid-cols-[110px_60px_minmax(140px,1fr)_100px_100px_90px_90px_100px] gap-3 px-4 py-2 border-b border-gray-200 bg-gray-50 text-[10px]">
                <SortHeader label="Bill #" sortKey="billNumber" currentKey={sortKey} dir={sortDir} onChange={handleSort} />
                <SortHeader label="Table" sortKey="table" currentKey={sortKey} dir={sortDir} onChange={handleSort} />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500">Customer</span>
                <SortHeader label="Total" sortKey="total" currentKey={sortKey} dir={sortDir} onChange={handleSort} align="right" />
                <SortHeader label="Balance" sortKey="balance" currentKey={sortKey} dir={sortDir} onChange={handleSort} align="right" />
                <SortHeader label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onChange={handleSort} />
                <SortHeader label="Date" sortKey="createdAt" currentKey={sortKey} dir={sortDir} onChange={handleSort} />
                <span />
            </div>

            <div className="divide-y divide-gray-100">
                {sorted.map((bill) => {
                    const tableNum = bill.tableSession?.table?.tableNumber;
                    const style = statusStyles[bill.status] || statusStyles.GENERATED;
                    const balance = bill.totalAmount - bill.paidAmount;
                    const isSettleable = (bill.status === "GENERATED" || bill.status === "PARTIALLY_PAID") && balance > 0;
                    const time = new Date(bill.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    });

                    return (
                        <button
                            key={bill.id}
                            type="button"
                            onClick={() => onViewDetails(bill)}
                            className="w-full grid grid-cols-[110px_60px_minmax(140px,1fr)_100px_100px_90px_90px_100px] gap-3 px-4 py-2.5 items-center text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-xs font-mono font-semibold text-gray-900 truncate">{bill.billNumber}</span>
                            <span className="text-xs text-gray-700">{tableNum ?? "—"}</span>
                            <span className="text-xs text-gray-700 truncate">
                                {bill.customer
                                    ? <>{bill.customer.name ?? "—"} <span className="text-gray-400">· {bill.customer.phone}</span></>
                                    : <span className="text-gray-400">Walk-in</span>
                                }
                            </span>
                            <span className="text-xs font-semibold text-gray-900 tabular-nums text-right">
                                {formatPaise(bill.totalAmount)}
                            </span>
                            <span className={`text-xs tabular-nums text-right ${balance > 0 && bill.status !== "CANCELLED" ? "text-amber-700 font-semibold" : "text-gray-400"}`}>
                                {balance > 0 ? formatPaise(balance) : "—"}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit ${style?.className}`}>
                                {style?.label}
                            </span>
                            <span className="text-[11px] text-gray-500">{time}</span>
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                {isSettleable && (
                                    <QuickSettlePopover
                                        billId={bill.id}
                                        balance={balance}
                                        onSettled={onUpdate}
                                    />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            </div>
        </div>
    );
}
