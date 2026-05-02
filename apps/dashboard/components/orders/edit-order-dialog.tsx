"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@repo/ui/components/dialog";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { MenuService, OrderService } from "@repo/api-sdk";
import { type Category, type Item } from "@repo/types";
import { useToast } from "@/lib/use-toast";

type CategoryWithItems = Category & { items: Item[] };

interface OrderItem {
    id: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}

type EditOrderDialogProps = {
    shopId: string;
    orderId: string;
    currentItems: OrderItem[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

export function EditOrderDialog({
    shopId,
    orderId,
    currentItems,
    open,
    onOpenChange,
    onSuccess,
}: EditOrderDialogProps) {
    const { success, error } = useToast();
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load menu on open
    useEffect(() => {
        if (!open) return;
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            try {
                const menu = await MenuService.getMenuByShopId(shopId);
                if (cancelled) return;

                if (menu?.categories) {
                    setCategories(
                        menu.categories
                            .map((c: any) => ({
                                ...c,
                                items: (c.items ?? []).filter((i: any) => i.isAvailable !== false),
                            }))
                            .filter((c: any) => c.items.length > 0),
                    );
                }
            } catch (err: any) {
                if (cancelled) return;
                error(err?.response?.data?.message || "Failed to load menu");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [open, shopId]);

    // Pre-populate quantities from current items
    useEffect(() => {
        if (!open) return;
        const map = new Map<string, number>();
        currentItems.forEach((item) => {
            map.set(item.itemId, item.quantity);
        });
        setQuantities(map);
    }, [open, currentItems]);

    const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return categories;
        return categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((i) => i.name.toLowerCase().includes(q)),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [categories, searchQuery]);

    const allItemsById = useMemo(() => {
        const map = new Map<string, Item>();
        categories.forEach((cat) => cat.items.forEach((i) => map.set(i.id, i)));
        return map;
    }, [categories]);

    const selectedEntries = useMemo(
        () =>
            Array.from(quantities.entries())
                .filter(([, qty]) => qty > 0)
                .map(([itemId, qty]) => ({ item: allItemsById.get(itemId)!, quantity: qty }))
                .filter((entry) => entry.item),
        [quantities, allItemsById],
    );

    const totalAmount = useMemo(
        () => selectedEntries.reduce((sum, e) => sum + e.item.price * e.quantity, 0),
        [selectedEntries],
    );

    const updateQty = (itemId: string, delta: number) => {
        setQuantities((prev) => {
            const next = new Map(prev);
            const current = next.get(itemId) ?? 0;
            const updated = Math.max(0, current + delta);
            if (updated === 0) next.delete(itemId);
            else next.set(itemId, updated);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (selectedEntries.length === 0) {
            error("Order must have at least one item");
            return;
        }

        setIsSubmitting(true);
        try {
            await OrderService.updateOrderItems(
                orderId,
                selectedEntries.map((e) => ({
                    itemId: e.item.id,
                    quantity: e.quantity,
                })),
            );
            success("Order updated successfully");
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to update order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogTitle className="px-5 py-4 border-b text-lg font-semibold shrink-0">
                    Edit Order Items
                </DialogTitle>

                <div className="px-5 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="px-5 py-3 space-y-4">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading menu...
                            </div>
                        )}

                        {!isLoading && filteredCategories.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No items available
                            </div>
                        )}

                        {!isLoading &&
                            filteredCategories.map((cat) => (
                                <div key={cat.id} className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {cat.name}
                                    </h3>
                                    <div className="space-y-1">
                                        {cat.items.map((item) => {
                                            const qty = quantities.get(item.id) ?? 0;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`h-2.5 w-2.5 rounded-sm border ${
                                                                    item.isVeg
                                                                        ? "border-green-600"
                                                                        : "border-red-600"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`block h-full w-full rounded-full ${
                                                                        item.isVeg
                                                                            ? "bg-green-600"
                                                                            : "bg-red-600"
                                                                    }`}
                                                                    style={{ transform: "scale(0.55)" }}
                                                                />
                                                            </span>
                                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            ₹{Math.round(item.price / 100)}
                                                        </span>
                                                    </div>

                                                    {qty === 0 ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs"
                                                            onClick={() => updateQty(item.id, 1)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQty(item.id, -1)}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="text-sm font-semibold w-6 text-center">
                                                                {qty}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQty(item.id, 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="px-5 py-4 border-t bg-gray-50 space-y-3 shrink-0">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            {selectedEntries.length === 0
                                ? "No items selected"
                                : `${selectedEntries.reduce((s, e) => s + e.quantity, 0)} item(s) selected`}
                        </span>
                        <span className="text-base font-bold text-gray-900">
                            ₹{Math.round(totalAmount / 100)}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 bg-red-500 hover:bg-red-600"
                            disabled={isSubmitting || isLoading || selectedEntries.length === 0}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Updating...
                                </>
                            ) : (
                                "Update Order"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
