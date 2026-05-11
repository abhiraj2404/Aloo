"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Minus, Plus } from "lucide-react";
import type { Item, ItemVariant, Addon, AddonGroup } from "@repo/types";
import { useCart } from "@/lib/cart-context";
import { useThemeVars } from "@/lib/theme-context";

interface ItemCustomizerProps {
    item: Item | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatRupees = (paise: number) => `₹${Math.round(paise / 100)}`;

export const ItemCustomizer = ({ item, open, onOpenChange }: ItemCustomizerProps) => {
    const themeVars = useThemeVars();
    const { addLine } = useCart();
    const variants = item?.variants ?? [];
    const addonGroups = item?.addonGroups ?? [];

    // Variant default = first variant (variants are required when present, like PetPooja)
    const [variantId, setVariantId] = useState<string | null>(null);
    // For each addon group: ids selected
    const [selected, setSelected] = useState<Record<string, Set<string>>>({});
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Reset state when sheet opens with a new item
    useEffect(() => {
        if (!open || !item) return;
        setVariantId(variants[0]?.id ?? null);
        setSelected(
            Object.fromEntries(addonGroups.map((g) => [g.id, new Set<string>()])),
        );
        setQuantity(1);
        setError(null);
    }, [open, item?.id]);

    const selectedVariant: ItemVariant | null = useMemo(() => {
        if (!variantId) return null;
        return variants.find((v) => v.id === variantId) ?? null;
    }, [variantId, variants]);

    const selectedAddons: Addon[] = useMemo(() => {
        const out: Addon[] = [];
        for (const g of addonGroups) {
            const ids = selected[g.id] ?? new Set();
            for (const a of g.addons ?? []) {
                if (ids.has(a.id)) out.push(a);
            }
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
            const isSingleChoice = group.maxSelect === 1;
            if (current.has(addonId)) {
                current.delete(addonId);
            } else {
                if (isSingleChoice) current.clear();
                else if (current.size >= group.maxSelect) return prev; // max reached
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
            if (count < g.minSelect) {
                return `Choose at least ${g.minSelect} from "${g.name}"`;
            }
        }
        return null;
    };

    const handleAdd = () => {
        if (!item) return;
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        addLine({ item, variant: selectedVariant, addons: selectedAddons, quantity });
        onOpenChange(false);
    };

    if (!item) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="rounded-t-2xl h-[85vh] p-0 flex flex-col"
                style={{ ...themeVars, backgroundColor: themeVars["--sf-bg"] } as React.CSSProperties}
            >
                <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${themeVars["--sf-border"]}` }}>
                    <SheetTitle className="text-left text-lg font-bold" style={{ color: themeVars["--sf-text"] }}>
                        {item.name}
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="px-5 py-4 space-y-5">
                        {item.image && (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-40 object-cover rounded-xl"
                            />
                        )}

                        {/* Variants — radio group */}
                        {variants.length > 0 && (
                            <section className="space-y-2">
                                <header className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold" style={{ color: themeVars["--sf-text"] }}>
                                        Variations
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wide font-semibold text-red-500">
                                        Required
                                    </span>
                                </header>
                                <div className="space-y-1.5">
                                    {variants.map((v) => {
                                        const checked = variantId === v.id;
                                        return (
                                            <label
                                                key={v.id}
                                                className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                                                style={{
                                                    border: `1px solid ${checked ? themeVars["--sf-accent"] : themeVars["--sf-border"]}`,
                                                    backgroundColor: checked ? themeVars["--sf-accent-light"] : "transparent",
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="variant"
                                                        checked={checked}
                                                        onChange={() => {
                                                            setVariantId(v.id);
                                                            setError(null);
                                                        }}
                                                        className="accent-current"
                                                        style={{ accentColor: themeVars["--sf-accent"] }}
                                                    />
                                                    <span className="text-sm" style={{ color: themeVars["--sf-text"] }}>
                                                        {v.name}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold" style={{ color: themeVars["--sf-text"] }}>
                                                    {formatRupees(v.price)}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Addon groups */}
                        {addonGroups.map((g) => {
                            const isSingle = g.maxSelect === 1;
                            const sel = selected[g.id] ?? new Set();
                            return (
                                <section key={g.id} className="space-y-2">
                                    <header className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold" style={{ color: themeVars["--sf-text"] }}>
                                            {g.name}
                                        </h3>
                                        <span
                                            className="text-[10px] uppercase tracking-wide font-semibold"
                                            style={{ color: g.minSelect > 0 ? "#ef4444" : themeVars["--sf-text-secondary"] }}
                                        >
                                            {g.minSelect > 0 ? "Required" : "Optional"} · max {g.maxSelect}
                                        </span>
                                    </header>
                                    <div className="space-y-1.5">
                                        {(g.addons ?? []).map((a) => {
                                            const checked = sel.has(a.id);
                                            return (
                                                <label
                                                    key={a.id}
                                                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                                                    style={{
                                                        border: `1px solid ${checked ? themeVars["--sf-accent"] : themeVars["--sf-border"]}`,
                                                        backgroundColor: checked ? themeVars["--sf-accent-light"] : "transparent",
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type={isSingle ? "radio" : "checkbox"}
                                                            name={`group-${g.id}`}
                                                            checked={checked}
                                                            onChange={() => toggleAddon(g, a.id)}
                                                            style={{ accentColor: themeVars["--sf-accent"] }}
                                                        />
                                                        <span className="text-sm" style={{ color: themeVars["--sf-text"] }}>
                                                            {a.name}
                                                        </span>
                                                    </div>
                                                    {a.price > 0 && (
                                                        <span className="text-sm font-medium" style={{ color: themeVars["--sf-text-secondary"] }}>
                                                            +{formatRupees(a.price)}
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}

                        {error && (
                            <p className="text-xs" style={{ color: themeVars["--sf-accent"] }}>
                                {error}
                            </p>
                        )}
                    </div>
                </ScrollArea>

                <div
                    className="px-5 py-4"
                    style={{
                        borderTop: `1px solid ${themeVars["--sf-border"]}`,
                        backgroundColor: themeVars["--sf-bg"],
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-1 rounded-lg px-1 h-11"
                            style={{ border: `1px solid ${themeVars["--sf-border"]}` }}
                        >
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-7 text-center text-sm font-bold" style={{ color: themeVars["--sf-text"] }}>
                                {quantity}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => setQuantity((q) => q + 1)}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <Button
                            className="flex-1 h-11 text-white font-semibold rounded-xl text-base"
                            style={{ backgroundColor: themeVars["--sf-accent"] }}
                            onClick={handleAdd}
                        >
                            Add to Cart • {formatRupees(unitPrice * quantity)}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
