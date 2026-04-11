"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Item } from "@repo/types";

interface CartItem {
    item: Item;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    getItemQuantity: (itemId: string) => number;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = useCallback((item: Item) => {
        setItems((prev) => {
            const existing = prev.find((ci) => ci.item.id === item.id);
            if (existing) {
                return prev.map((ci) =>
                    ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
                );
            }
            return [...prev, { item, quantity: 1 }];
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
            return;
        }
        setItems((prev) =>
            prev.map((ci) =>
                ci.item.id === itemId ? { ...ci, quantity } : ci
            )
        );
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const getItemQuantity = useCallback(
        (itemId: string) => items.find((ci) => ci.item.id === itemId)?.quantity ?? 0,
        [items]
    );

    const totalItems = useMemo(
        () => items.reduce((sum, ci) => sum + ci.quantity, 0),
        [items]
    );

    const totalAmount = useMemo(
        () => items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, updateQuantity, clearCart, getItemQuantity, totalItems, totalAmount }}
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
