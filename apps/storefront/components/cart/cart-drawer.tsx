"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useThemeVars } from "@/lib/theme-context";
import { CartItemRow } from "./cart-item-row";
import { OrderService, TableService } from "@repo/api-sdk";
import { addOrderId } from "@/lib/order-store";
import { getStoredCustomer, saveStoredCustomer } from "@/lib/customer-store";

interface CartDrawerProps {
    shopId: string;
    tableNumber: number | null;
    onOrderPlaced: () => void;
}

type OrderType = "DINE_IN" | "TAKEAWAY";

// India default; storefront is currently India-only. If we ever go multi-country
// this should come from shop config.
const DEFAULT_COUNTRY_CODE = "+91";

const toE164 = (rawPhone: string): string | null => {
    const digits = rawPhone.replace(/[^0-9]/g, "");
    if (rawPhone.trim().startsWith("+")) {
        // Already E.164-ish — validate length
        return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
    }
    // Bare 10-digit Indian number
    if (digits.length === 10) return `${DEFAULT_COUNTRY_CODE}${digits}`;
    return null;
};

export const CartDrawer = ({ shopId, tableNumber, onOrderPlaced }: CartDrawerProps) => {
    const { lines, totalItems, totalAmount, clearCart } = useCart();
    const themeVars = useThemeVars();
    const [isOpen, setIsOpen] = useState(false);
    const [isPlacing, setIsPlacing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Single-QR mode: customer landed without ?table= in URL. We let them choose.
    const isSingleQrMode = tableNumber == null;
    const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
    const [pickedTableNumber, setPickedTableNumber] = useState<number | null>(null);
    const [tables, setTables] = useState<{ id: string; tableNumber: number }[]>([]);
    const [tablesLoading, setTablesLoading] = useState(false);

    const totalInRupees = Math.round(totalAmount / 100);

    // Effective table number passed to the API
    const effectiveTableNumber = isSingleQrMode
        ? (orderType === "DINE_IN" ? pickedTableNumber : null)
        : tableNumber;

    // Auto-fill from localStorage when sheet opens (silent — no banner)
    useEffect(() => {
        if (!isOpen) return;
        const stored = getStoredCustomer(shopId);
        if (stored) {
            setPhone(stored.phone);
            if (stored.name) setName(stored.name);
        }
    }, [isOpen, shopId]);

    // Fetch tables lazily for single-QR mode (only when sheet opens)
    useEffect(() => {
        if (!isOpen || !isSingleQrMode || tables.length > 0) return;
        setTablesLoading(true);
        TableService.getAllTables(shopId)
            .then((res: any) => setTables(Array.isArray(res) ? res : []))
            .catch(() => setTables([]))
            .finally(() => setTablesLoading(false));
    }, [isOpen, isSingleQrMode, shopId, tables.length]);

    const sortedTables = useMemo(
        () => [...tables].sort((a, b) => a.tableNumber - b.tableNumber),
        [tables],
    );

    const handlePlaceOrder = async () => {
        if (lines.length === 0) return;
        setError(null);

        const e164 = toE164(phone);
        if (!e164) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        const finalOrderType: OrderType = isSingleQrMode ? orderType : "DINE_IN";
        if (finalOrderType === "DINE_IN" && effectiveTableNumber == null) {
            setError("Please choose your table");
            return;
        }

        setIsPlacing(true);
        try {
            const order = await OrderService.createOrder({
                shopId,
                tableNumber: effectiveTableNumber ?? undefined,
                orderType: finalOrderType,
                customerPhone: e164,
                customerName: name.trim() || undefined,
                items: lines.map((l) => ({
                    itemId: l.item.id,
                    quantity: l.quantity,
                    variantId: l.variant?.id,
                    addonIds: l.addons.length ? l.addons.map((a) => a.id) : undefined,
                })) as any, // CreateOrderItem[] — typed loosely here because the SDK's items type is from CreateOrderSchema
            });

            if (order?.id && effectiveTableNumber != null) {
                addOrderId(shopId, effectiveTableNumber, order.id);
            }

            saveStoredCustomer(shopId, { phone: e164, name: name.trim() || undefined });

            clearCart();
            setOrderSuccess(true);
            onOrderPlaced();

            setTimeout(() => {
                setOrderSuccess(false);
                setIsOpen(false);
            }, 2000);
        } catch (err: any) {
            console.error("Failed to place order:", err);
            const msg = err?.response?.data?.message || "Failed to place order";
            setError(msg);
        } finally {
            setIsPlacing(false);
        }
    };

    if (totalItems === 0 && !isOpen) return null;

    const placeDisabled =
        isPlacing ||
        lines.length === 0 ||
        (isSingleQrMode && orderType === "DINE_IN" && effectiveTableNumber == null);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3 transition-colors"
                style={{ backgroundColor: "var(--sf-cart-bar-bg)", color: "var(--sf-cart-bar-text)" }}
            >
                <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span
                        className="absolute -top-2 -right-2 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                        style={{ backgroundColor: "var(--sf-accent)" }}
                    >
                        {totalItems}
                    </span>
                </div>
                <span className="font-semibold text-sm">View Cart</span>
                <span className="text-sm font-semibold">•</span>
                <span className="font-semibold text-sm">₹{totalInRupees}</span>
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-2xl h-[85vh] p-0"
                    style={{ ...themeVars, backgroundColor: themeVars["--sf-bg"] } as React.CSSProperties}
                >
                    <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${themeVars["--sf-border"]}` }}>
                        <SheetTitle className="text-lg font-bold" style={{ color: themeVars["--sf-text"] }}>
                            Your Order ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </SheetTitle>
                    </SheetHeader>

                    {orderSuccess ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 px-5">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: themeVars["--sf-accent-light"] }}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeVars["--sf-accent"] }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: themeVars["--sf-text"] }}>Order Placed!</h3>
                            <p className="text-sm mt-1" style={{ color: themeVars["--sf-text-secondary"] }}>Your order has been sent to the kitchen</p>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="flex-1 px-5 h-[calc(85vh-340px)]">
                                <div className="py-2">
                                    {lines.map((l) => (
                                        <CartItemRow key={l.lineId} lineId={l.lineId} />
                                    ))}
                                </div>
                            </ScrollArea>

                            <div
                                className="px-5 py-4 space-y-3"
                                style={{ borderTop: `1px solid ${themeVars["--sf-border"]}`, backgroundColor: themeVars["--sf-bg"] }}
                            >
                                {isSingleQrMode && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            {(["DINE_IN", "TAKEAWAY"] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setOrderType(t)}
                                                    disabled={isPlacing}
                                                    className="h-10 rounded-lg text-sm font-semibold transition-colors"
                                                    style={
                                                        orderType === t
                                                            ? { backgroundColor: themeVars["--sf-accent"], color: "white" }
                                                            : { backgroundColor: themeVars["--sf-bg-secondary"], color: themeVars["--sf-text"] }
                                                    }
                                                >
                                                    {t === "DINE_IN" ? "Dine-in" : "Takeaway"}
                                                </button>
                                            ))}
                                        </div>
                                        {orderType === "DINE_IN" && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium" style={{ color: themeVars["--sf-text-secondary"] }}>
                                                    Table number <span style={{ color: themeVars["--sf-accent"] }}>*</span>
                                                </label>
                                                <select
                                                    value={pickedTableNumber ?? ""}
                                                    onChange={(e) =>
                                                        setPickedTableNumber(e.target.value ? parseInt(e.target.value, 10) : null)
                                                    }
                                                    disabled={isPlacing || tablesLoading}
                                                    className="w-full h-10 rounded-md border px-3 text-sm"
                                                    style={{
                                                        borderColor: themeVars["--sf-border"],
                                                        backgroundColor: themeVars["--sf-bg"],
                                                        color: themeVars["--sf-text"],
                                                    }}
                                                >
                                                    <option value="">
                                                        {tablesLoading ? "Loading tables..." : "Select your table"}
                                                    </option>
                                                    {sortedTables.map((t) => (
                                                        <option key={t.id} value={t.tableNumber}>
                                                            Table {t.tableNumber}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium" style={{ color: themeVars["--sf-text-secondary"] }}>
                                            Mobile number <span style={{ color: themeVars["--sf-accent"] }}>*</span>
                                        </label>
                                        <Input
                                            type="tel"
                                            inputMode="tel"
                                            placeholder="10-digit mobile"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={isPlacing}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium" style={{ color: themeVars["--sf-text-secondary"] }}>
                                            Name (optional)
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isPlacing}
                                            maxLength={80}
                                            className="h-10"
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-xs" style={{ color: themeVars["--sf-accent"] }}>
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm" style={{ color: themeVars["--sf-text-secondary"] }}>Total</span>
                                    <span className="text-lg font-bold" style={{ color: themeVars["--sf-text"] }}>₹{totalInRupees}</span>
                                </div>
                                <Button
                                    className="w-full h-12 text-white font-semibold rounded-xl text-base"
                                    style={{ backgroundColor: themeVars["--sf-accent"] }}
                                    onClick={handlePlaceOrder}
                                    disabled={placeDisabled || isPlacing}
                                >
                                    {isPlacing ? "Placing Order..." : `Place Order • ₹${totalInRupees}`}
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
};
