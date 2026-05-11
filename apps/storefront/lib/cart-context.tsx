"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Item, ItemVariant, Addon } from "@repo/types";

// Each cart line is a distinct (item + variant + addon set) selection.
// Two adds of the same dish with different addons stay as separate lines;
// adding the exact same configuration again increments the existing line.
export interface CartLine {
    lineId: string;
    item: Item;
    variant: ItemVariant | null;
    addons: Addon[];
    unitPrice: number;        // (variant or item) + sum(addons) — paise
    quantity: number;
}

interface AddLineSpec {
    item: Item;
    variant?: ItemVariant | null;
    addons?: Addon[];
    quantity?: number;
}

interface CartContextType {
    lines: CartLine[];
    addLine: (spec: AddLineSpec) => void;
    setLineQuantity: (lineId: string, quantity: number) => void;
    removeLine: (lineId: string) => void;
    clearCart: () => void;
    // Helpers for the menu card (simple items have a deterministic lineId)
    getSimpleLineId: (itemId: string) => string;
    getItemTotalQuantity: (itemId: string) => number;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const buildLineId = (itemId: string, variantId: string | null, addonIds: string[]): string => {
    const sortedAddons = [...addonIds].sort().join(",");
    return `${itemId}__${variantId ?? ""}__${sortedAddons}`;
};

const computeUnitPrice = (item: Item, variant: ItemVariant | null, addons: Addon[]): number => {
    const base = variant ? variant.price : item.price;
    return base + addons.reduce((sum, a) => sum + a.price, 0);
};

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);

    const addLine = useCallback((spec: AddLineSpec) => {
        const variant = spec.variant ?? null;
        const addons = spec.addons ?? [];
        const qty = spec.quantity ?? 1;
        const lineId = buildLineId(spec.item.id, variant?.id ?? null, addons.map((a) => a.id));
        const unitPrice = computeUnitPrice(spec.item, variant, addons);

        setLines((prev) => {
            const existing = prev.find((l) => l.lineId === lineId);
            if (existing) {
                return prev.map((l) =>
                    l.lineId === lineId ? { ...l, quantity: l.quantity + qty } : l,
                );
            }
            return [...prev, { lineId, item: spec.item, variant, addons, unitPrice, quantity: qty }];
        });
    }, []);

    const setLineQuantity = useCallback((lineId: string, quantity: number) => {
        if (quantity <= 0) {
            setLines((prev) => prev.filter((l) => l.lineId !== lineId));
            return;
        }
        setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)));
    }, []);

    const removeLine = useCallback((lineId: string) => {
        setLines((prev) => prev.filter((l) => l.lineId !== lineId));
    }, []);

    const clearCart = useCallback(() => setLines([]), []);

    const getSimpleLineId = useCallback((itemId: string) => buildLineId(itemId, null, []), []);

    const getItemTotalQuantity = useCallback(
        (itemId: string) => lines.filter((l) => l.item.id === itemId).reduce((sum, l) => sum + l.quantity, 0),
        [lines],
    );

    const totalItems = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
    const totalAmount = useMemo(
        () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
        [lines],
    );

    return (
        <CartContext.Provider
            value={{
                lines,
                addLine,
                setLineQuantity,
                removeLine,
                clearCart,
                getSimpleLineId,
                getItemTotalQuantity,
                totalItems,
                totalAmount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
