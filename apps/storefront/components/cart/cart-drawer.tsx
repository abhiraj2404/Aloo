"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { CartItemRow } from "./cart-item-row";
import { OrderService } from "@repo/api-sdk";
import { addOrderId } from "@/lib/order-store";

interface CartDrawerProps {
    shopId: string;
    tableNumber: number | null;
    onOrderPlaced: () => void;
}

export const CartDrawer = ({ shopId, tableNumber, onOrderPlaced }: CartDrawerProps) => {
    const { items, totalItems, totalAmount, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [isPlacing, setIsPlacing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const totalInRupees = Math.round(totalAmount / 100);

    const handlePlaceOrder = async () => {
        if (items.length === 0 || !tableNumber) return;

        setIsPlacing(true);
        try {
            const order = await OrderService.createOrder({
                shopId,
                tableNumber,
                items: items.map((ci) => ({
                    itemId: ci.item.id,
                    quantity: ci.quantity,
                })),
            });

            if (order?.id) {
                addOrderId(shopId, tableNumber, order.id);
            }

            clearCart();
            setOrderSuccess(true);
            onOrderPlaced();

            setTimeout(() => {
                setOrderSuccess(false);
                setIsOpen(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to place order:", err);
        } finally {
            setIsPlacing(false);
        }
    };

    if (totalItems === 0 && !isOpen) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#33272a] text-white rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors"
            >
                <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {totalItems}
                    </span>
                </div>
                <span className="font-semibold text-sm">View Cart</span>
                <span className="text-sm font-semibold">•</span>
                <span className="font-semibold text-sm">₹{totalInRupees}</span>
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl h-[85vh] p-0 bg-white">
                    <SheetHeader className="px-5 pt-5 pb-3 border-b">
                        <SheetTitle className="text-lg font-bold text-[#33272a]">
                            Your Order ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </SheetTitle>
                    </SheetHeader>

                    {orderSuccess ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 px-5">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#33272a]">Order Placed!</h3>
                            <p className="text-sm text-[#594a4e] mt-1">Your order has been sent to the kitchen</p>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="flex-1 px-5 h-[calc(85vh-180px)]">
                                <div className="py-2">
                                    {items.map((ci) => (
                                        <CartItemRow key={ci.item.id} itemId={ci.item.id} />
                                    ))}
                                </div>

                                
                            </ScrollArea>

                            <div className="border-t px-5 py-4 bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-[#594a4e]">Total</span>
                                    <span className="text-lg font-bold text-[#33272a]">₹{totalInRupees}</span>
                                </div>
                                <Button
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-base"
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacing || items.length === 0 || !tableNumber}
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
