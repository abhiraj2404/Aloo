"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Switch } from "@repo/ui/components/switch";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Loader2, Search } from "lucide-react";
import { MenuService } from "@repo/api-sdk";
import type { Category, Item } from "@repo/types";
import { useToast } from "@/lib/use-toast";

type CategoryWithItems = Category & { items: Item[] };

// "86" = restaurant slang for "out of stock / unavailable." Quick toggle so kitchen
// staff can flip an item's availability without leaving the display.
export function EightySixSheet({
    shopId,
    open,
    onOpenChange,
}: {
    shopId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { success, error } = useToast();
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [pendingId, setPendingId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const menu = await MenuService.getMenuByShopId(shopId);
                if (cancelled) return;
                setCategories((menu?.categories ?? []).map((c: any) => ({
                    ...c,
                    items: c.items ?? [],
                })));
            } catch (err: any) {
                if (!cancelled) error(err?.response?.data?.message || "Failed to load menu");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, shopId, error]);

    const toggle = async (item: Item, nextAvailable: boolean) => {
        setPendingId(item.id);
        try {
            await MenuService.toggleItemAvailability(item.id, shopId, nextAvailable);
            // Optimistic local update
            setCategories((prev) =>
                prev.map((c) => ({
                    ...c,
                    items: c.items.map((i) => (i.id === item.id ? { ...i, isAvailable: nextAvailable } : i)),
                })),
            );
            success(nextAvailable ? `"${item.name}" back on menu` : `"${item.name}" 86'd`);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to toggle item");
        } finally {
            setPendingId(null);
        }
    };

    const q = query.trim().toLowerCase();
    const filtered = categories
        .map((c) => ({
            ...c,
            items: q ? c.items.filter((i) => i.name.toLowerCase().includes(q)) : c.items,
        }))
        .filter((c) => c.items.length > 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="px-5 py-4 border-b">
                    <SheetTitle>86 Menu Items</SheetTitle>
                    <p className="text-xs text-gray-500">Toggle off to mark an item unavailable to customers and POS.</p>
                </SheetHeader>

                <div className="px-5 py-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search items..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading menu...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            {q ? "No items match" : "No items"}
                        </div>
                    ) : (
                        <div className="px-3 py-3 space-y-4">
                            {filtered.map((cat) => (
                                <div key={cat.id} className="space-y-1">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                                        {cat.name}
                                    </h3>
                                    <div className="space-y-1">
                                        {cat.items.map((item) => {
                                            const available = item.isAvailable !== false;
                                            const isPending = pendingId === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-md ${
                                                        available ? "bg-white" : "bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`h-2.5 w-2.5 rounded-sm border ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                                            <span className={`block h-full w-full rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} style={{ transform: "scale(0.55)" }} />
                                                        </span>
                                                        <span className={`text-sm truncate ${available ? "text-gray-900" : "text-gray-400 line-through"}`}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <Switch
                                                        checked={available}
                                                        onCheckedChange={(checked) => toggle(item, checked)}
                                                        disabled={isPending}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
