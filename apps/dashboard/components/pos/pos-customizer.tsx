"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Minus, Plus } from "lucide-react";
import type { Item, ItemVariant, Addon, AddonGroup } from "@repo/types";

const formatRupees = (paise: number) => `₹${Math.round(paise / 100)}`;

export type DraftLineInput = {
    item: Item;
    variant: ItemVariant | null;
    addons: Addon[];
    quantity: number;
};

export function PosCustomizer({
    item,
    open,
    onOpenChange,
    onAdd,
}: {
    item: Item | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (line: DraftLineInput) => void;
}) {
    const variants = item?.variants ?? [];
    const addonGroups = item?.addonGroups ?? [];

    const [variantId, setVariantId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, Set<string>>>({});
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !item) return;
        setVariantId(variants[0]?.id ?? null);
        setSelected(Object.fromEntries(addonGroups.map((g) => [g.id, new Set<string>()])));
        setQuantity(1);
        setError(null);
    }, [open, item?.id]);

    const selectedVariant = useMemo<ItemVariant | null>(
        () => (variantId ? variants.find((v) => v.id === variantId) ?? null : null),
        [variantId, variants],
    );

    const selectedAddons = useMemo<Addon[]>(() => {
        const out: Addon[] = [];
        for (const g of addonGroups) {
            const ids = selected[g.id] ?? new Set();
            for (const a of g.addons ?? []) if (ids.has(a.id)) out.push(a);
        }
        return out;
    }, [selected, addonGroups]);

    const unitPrice = useMemo(() => {
        if (!item) return 0;
        const base = selectedVariant ? selectedVariant.price : item.price;
        return base + selectedAddons.reduce((s, a) => s + a.price, 0);
    }, [item, selectedVariant, selectedAddons]);

    const toggleAddon = (group: AddonGroup, addonId: string) => {
        setSelected((prev) => {
            const next = { ...prev };
            const current = new Set(next[group.id] ?? []);
            const isSingle = group.maxSelect === 1;
            if (current.has(addonId)) {
                current.delete(addonId);
            } else {
                if (isSingle) current.clear();
                else if (current.size >= group.maxSelect) return prev;
                current.add(addonId);
            }
            next[group.id] = current;
            return next;
        });
        setError(null);
    };

    const validate = (): string | null => {
        if (variants.length > 0 && !selectedVariant) return "Please choose a variation";
        for (const g of addonGroups) {
            const count = (selected[g.id] ?? new Set()).size;
            if (count < g.minSelect) return `Choose at least ${g.minSelect} from "${g.name}"`;
        }
        return null;
    };

    const handleAdd = () => {
        if (!item) return;
        const v = validate();
        if (v) { setError(v); return; }
        onAdd({ item, variant: selectedVariant, addons: selectedAddons, quantity });
        onOpenChange(false);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 flex flex-col max-h-[85vh]">
                <DialogTitle className="px-5 pt-5 pb-3 border-b text-lg font-bold">
                    {item.name}
                </DialogTitle>

                <ScrollArea className="flex-1">
                    <div className="px-5 py-4 space-y-5">
                        {variants.length > 0 && (
                            <section className="space-y-2">
                                <header className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">Variations</h3>
                                    <span className="text-[10px] uppercase tracking-wide font-semibold text-red-500">Required</span>
                                </header>
                                <div className="space-y-1.5">
                                    {variants.map((v) => {
                                        const checked = variantId === v.id;
                                        return (
                                            <label
                                                key={v.id}
                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${
                                                    checked ? "border-red-500 bg-red-50" : "border-gray-200"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="variant"
                                                        checked={checked}
                                                        onChange={() => { setVariantId(v.id); setError(null); }}
                                                        className="accent-red-500"
                                                    />
                                                    <span className="text-sm">{v.name}</span>
                                                </div>
                                                <span className="text-sm font-semibold">{formatRupees(v.price)}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {addonGroups.map((g) => {
                            const isSingle = g.maxSelect === 1;
                            const sel = selected[g.id] ?? new Set();
                            return (
                                <section key={g.id} className="space-y-2">
                                    <header className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">{g.name}</h3>
                                        <span className={`text-[10px] uppercase tracking-wide font-semibold ${g.minSelect > 0 ? "text-red-500" : "text-gray-400"}`}>
                                            {g.minSelect > 0 ? "Required" : "Optional"} · max {g.maxSelect}
                                        </span>
                                    </header>
                                    <div className="space-y-1.5">
                                        {(g.addons ?? []).map((a) => {
                                            const checked = sel.has(a.id);
                                            return (
                                                <label
                                                    key={a.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${
                                                        checked ? "border-red-500 bg-red-50" : "border-gray-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type={isSingle ? "radio" : "checkbox"}
                                                            name={`group-${g.id}`}
                                                            checked={checked}
                                                            onChange={() => toggleAddon(g, a.id)}
                                                            className="accent-red-500"
                                                        />
                                                        <span className="text-sm">{a.name}</span>
                                                    </div>
                                                    {a.price > 0 && (
                                                        <span className="text-sm font-medium text-gray-600">+{formatRupees(a.price)}</span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}

                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                </ScrollArea>

                <div className="px-5 py-4 border-t bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-lg px-1 h-11 border bg-white">
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                                <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setQuantity((q) => q + 1)}>
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <Button className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl" onClick={handleAdd}>
                            Add • {formatRupees(unitPrice * quantity)}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
