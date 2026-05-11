"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutGrid, List, RefreshCw, Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { BillService } from "@repo/api-sdk";
import { BillCard, type BillData } from "./bill-card";
import { BillDetailDialog } from "./bill-detail-dialog";
import { BillsTable } from "./bills-table";
import { useToast } from "@/lib/use-toast";

type ViewMode = "cards" | "table";
const VIEW_STORAGE_KEY = "aloo:bills-view-mode";

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "GENERATED", label: "Unpaid" },
    { value: "PARTIALLY_PAID", label: "Partial" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
] as const;

export function BillsView({ shopId }: { shopId: string }) {
    const [bills, setBills] = useState<BillData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("cards");
    const { error } = useToast();

    // Restore the user's last-chosen view between sessions
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
        if (stored === "table" || stored === "cards") setViewMode(stored);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    }, [viewMode]);
    void shopId;

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const result = await BillService.getAllBills();
            setBills(Array.isArray(result) ? result : []);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to fetch bills";
            error(msg);
            setBills([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    // Refresh the selected bill when bills list updates
    useEffect(() => {
        if (selectedBill) {
            const updated = bills.find((b) => b.id === selectedBill.id);
            if (updated) setSelectedBill(updated);
        }
    }, [bills]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: bills.length };
        bills.forEach((b) => {
            counts[b.status] = (counts[b.status] || 0) + 1;
        });
        return counts;
    }, [bills]);

    const totalUnpaid = useMemo(() => {
        return bills
            .filter((b) => b.status === "GENERATED" || b.status === "PARTIALLY_PAID")
            .reduce((sum, b) => sum + b.totalAmount - b.paidAmount, 0);
    }, [bills]);

    const filteredBills = useMemo(() => {
        let result = bills;

        if (activeTab !== "all") {
            result = result.filter((b) => b.status === activeTab);
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter((b) => {
                const tableNum = b.tableSession?.table?.tableNumber;
                if (tableNum && `table ${tableNum}`.includes(q)) return true;
                if (b.billNumber?.toLowerCase().includes(q)) return true;
                // customer phone (cashier-friendly: try last digits) + name
                if (b.customer?.phone?.toLowerCase().includes(q)) return true;
                if (b.customer?.name?.toLowerCase().includes(q)) return true;
                return false;
            });
        }

        return result;
    }, [bills, activeTab, searchQuery]);

    const handleUpdate = () => {
        fetchBills();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Bills</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchBills}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    {totalUnpaid > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                            {(statusCounts.GENERATED ?? 0) + (statusCounts.PARTIALLY_PAID ?? 0)} Unpaid • ₹{(totalUnpaid / 100).toFixed(2)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
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

                <div className="flex items-center gap-2">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Bill #, table, name, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center border rounded-md p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("cards")}
                            title="Card view"
                            className={`p-1.5 rounded ${viewMode === "cards" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            title="Table view"
                            className={`p-1.5 rounded ${viewMode === "table" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
                {viewMode === "cards" ? (
                    <div className="space-y-2 pr-4 pb-4">
                        {filteredBills.map((bill) => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                onViewDetails={(b) => setSelectedBill(b)}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="pr-4 pb-4">
                        <BillsTable
                            bills={filteredBills}
                            onViewDetails={(b) => setSelectedBill(b)}
                            onUpdate={handleUpdate}
                        />
                    </div>
                )}
                {filteredBills.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {bills.length === 0 ? "No bills yet" : "No bills match your filter"}
                    </div>
                )}
            </ScrollArea>

            {selectedBill && (
                <BillDetailDialog
                    bill={selectedBill}
                    open={!!selectedBill}
                    onOpenChange={(open) => { if (!open) setSelectedBill(null); }}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
