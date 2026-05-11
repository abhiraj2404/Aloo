"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Scissors } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { BillService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type SplittableItem = {
    id: string;
    name: string;
    variantName?: string | null;
    addons?: { name: string; price: number }[] | null;
    quantity: number;
    price: number;
};

const formatPaise = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function SplitBillDialog({
    billId,
    items,
    open,
    onOpenChange,
    onSplit,
}: {
    billId: string;
    items: SplittableItem[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSplit: () => void;
}) {
    const { success, error } = useToast();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) setSelected(new Set());
    }, [open]);

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const movedSubtotal = useMemo(
        () => items.filter((i) => selected.has(i.id)).reduce((s, i) => s + i.price * i.quantity, 0),
        [items, selected],
    );
    const remainingSubtotal = useMemo(
        () => items.filter((i) => !selected.has(i.id)).reduce((s, i) => s + i.price * i.quantity, 0),
        [items, selected],
    );

    const canSplit = selected.size > 0 && selected.size < items.length;

    const handleSplit = async () => {
        if (!canSplit) return;
        setSubmitting(true);
        try {
            await BillService.split(billId, Array.from(selected));
            success("Bill split into two");
            onOpenChange(false);
            onSplit();
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to split bill");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
                <DialogTitle>Split Bill</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                    Pick items to move onto a new bill. Taxes recompute for both sides.
                    Clear any discount before splitting.
                </DialogDescription>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-1 py-2">
                        {items.map((item) => {
                            const checked = selected.has(item.id);
                            return (
                                <label
                                    key={item.id}
                                    className={`flex items-start gap-2 p-2 rounded-md cursor-pointer border ${
                                        checked ? "border-red-300 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(item.id)}
                                        className="accent-red-500 mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">
                                            {item.name}
                                            {item.variantName && <span className="text-gray-500"> · {item.variantName}</span>}
                                            <span className="text-gray-400"> × {item.quantity}</span>
                                        </p>
                                        {item.addons && item.addons.length > 0 && (
                                            <p className="text-[11px] text-gray-500">
                                                + {item.addons.map((a) => a.name).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-600 tabular-nums shrink-0">
                                        {formatPaise(item.price * item.quantity)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="border-t pt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">New bill subtotal</span>
                        <span className="font-semibold tabular-nums">{formatPaise(movedSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Remaining on original</span>
                        <span className="tabular-nums">{formatPaise(remainingSubtotal)}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        disabled={!canSplit || submitting}
                        onClick={handleSplit}
                    >
                        {submitting
                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            : <Scissors className="h-4 w-4 mr-2" />
                        }
                        Split off {selected.size} item{selected.size === 1 ? "" : "s"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
