"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { MenuService, OrderService, TableService } from "@repo/api-sdk";
import { type Category, type Item } from "@repo/types";
import { useToast } from "@/lib/use-toast";

type CategoryWithItems = Category & { items: Item[] };

type NewOrderFormProps = {
    shopId: string;
    onSuccess: () => void;
    onCancel: () => void;
};

export function NewOrderForm({ shopId, onSuccess, onCancel }: NewOrderFormProps) {
    const { success, error } = useToast();
    const [tables, setTables] = useState<{ id: string; tableNumber: number }[]>([]);
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [tableNumber, setTableNumber] = useState<string>("");
    const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [menu, tablesRes] = await Promise.all([
                    MenuService.getMenuByShopId(shopId),
                    TableService.getAllTables(shopId),
                ]);

                if (cancelled) return;

                if (menu?.categories) {
                    setCategories(
                        menu.categories.map((c) => ({
                            ...c,
                            items: (c.items ?? []).filter((i) => i.isAvailable !== false),
                        })).filter((c) => c.items.length > 0)
                    );
                }
                if (Array.isArray(tablesRes)) {
                    setTables(tablesRes);
                }
            } catch (err: any) {
                if (cancelled) return;
                error(err?.response?.data?.message || "Failed to load menu or tables");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [shopId]);

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
        [quantities, allItemsById]
    );

    const totalAmount = useMemo(
        () => selectedEntries.reduce((sum, e) => sum + e.item.price * e.quantity, 0),
        [selectedEntries]
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tableNumber) {
            error("Please select a table");
            return;
        }
        if (selectedEntries.length === 0) {
            error("Please add at least one item");
            return;
        }

        setIsSubmitting(true);
        try {
            await OrderService.createOrder({
                shopId,
                tableNumber: Number(tableNumber),
                orderType: "DINE_IN",
                items: selectedEntries.map((e) => ({
                    itemId: e.item.id,
                    quantity: e.quantity,
                })),
            });
            success("Order created successfully");
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to create order";
            error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b">
                <h2 className="text-lg font-semibold">New Order</h2>
            </div>

            <div className="px-5 py-4 border-b space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-gray-600 text-sm">Table</Label>
                    <Select value={tableNumber} onValueChange={setTableNumber}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a table" />
                        </SelectTrigger>
                        <SelectContent>
                            {tables
                                .slice()
                                .sort((a, b) => a.tableNumber - b.tableNumber)
                                .map((t) => (
                                    <SelectItem key={t.id} value={String(t.tableNumber)}>
                                        Table {t.tableNumber}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

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

            <ScrollArea className="flex-1 max-h-[40vh]">
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
            </ScrollArea>

            <div className="px-5 py-4 border-t bg-gray-50 space-y-3">
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
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        disabled={
                            isSubmitting ||
                            isLoading ||
                            !tableNumber ||
                            selectedEntries.length === 0
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Placing...
                            </>
                        ) : (
                            "Place Order"
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
