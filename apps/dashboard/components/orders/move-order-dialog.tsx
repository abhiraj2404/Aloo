"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { OrderService, TableService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type TableRow = {
    id: string;
    tableNumber: number;
    sessions?: { id: string; pax: number | null; customer: { name: string | null } | null }[];
};

export function MoveOrderDialog({
    shopId,
    orderId,
    currentTableNumber,
    open,
    onOpenChange,
    onMoved,
}: {
    shopId: string;
    orderId: string;
    currentTableNumber: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMoved: () => void;
}) {
    const { success, error } = useToast();
    const [tables, setTables] = useState<TableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await TableService.getAllTables(shopId);
                if (!cancelled) setTables(Array.isArray(data) ? data : []);
            } catch (err: any) {
                if (!cancelled) error(err?.response?.data?.message || "Failed to load tables");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, shopId, error]);

    const handleMove = async (table: TableRow) => {
        if (table.tableNumber === currentTableNumber) return;
        setSubmitting(table.id);
        try {
            await OrderService.moveToTable(orderId, table.id);
            success(`Order moved to Table ${table.tableNumber}`);
            onOpenChange(false);
            onMoved();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to move order");
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogTitle>Move Order</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                    Pick the target table. If it already has a running session, the order joins it; otherwise a new session opens.
                </DialogDescription>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading tables...
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {tables.map((t) => {
                            const isCurrent = t.tableNumber === currentTableNumber;
                            const isOccupied = (t.sessions?.length ?? 0) > 0;
                            const session = t.sessions?.[0];
                            const isSubmitting = submitting === t.id;

                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    disabled={isCurrent || isSubmitting}
                                    onClick={() => handleMove(t)}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-xs border-2 transition-all ${
                                        isCurrent
                                            ? "border-red-300 bg-red-50 cursor-not-allowed opacity-60"
                                            : isOccupied
                                                ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                                                : "border-gray-200 bg-white hover:border-red-300 hover:shadow-sm"
                                    }`}
                                >
                                    <span className="font-semibold text-gray-900">Table {t.tableNumber}</span>
                                    {isCurrent && <span className="text-[10px] text-red-500 mt-0.5">Current</span>}
                                    {!isCurrent && isOccupied && (
                                        <span className="text-[10px] text-amber-700 mt-0.5">
                                            {session?.pax ? `${session.pax} pax` : "Occupied"}
                                        </span>
                                    )}
                                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
