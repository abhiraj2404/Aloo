"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useCart } from "@/lib/cart-context";

export const CartItemRow = ({ lineId }: { lineId: string }) => {
    const { lines, setLineQuantity } = useCart();
    const line = lines.find((l) => l.lineId === lineId);
    if (!line) return null;

    const { item, variant, addons, quantity, unitPrice } = line;
    const lineTotalRupees = Math.round((unitPrice * quantity) / 100);

    return (
        <div className="flex items-start gap-3 py-3 last:border-0" style={{ borderBottom: "1px solid var(--sf-border)" }}>
            <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border shrink-0 mt-1 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--sf-text)" }}>
                    {item.name}
                    {variant && (
                        <span className="ml-1 text-xs font-normal" style={{ color: "var(--sf-text-secondary)" }}>
                            · {variant.name}
                        </span>
                    )}
                </p>
                {addons.length > 0 && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--sf-text-secondary)" }}>
                        + {addons.map((a) => a.name).join(", ")}
                    </p>
                )}
                <p className="text-sm mt-0.5" style={{ color: "var(--sf-text-secondary)" }}>₹{lineTotalRupees}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    style={{ borderColor: "var(--sf-border)" }}
                    onClick={() => setLineQuantity(lineId, quantity - 1)}
                >
                    {quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                </Button>
                <span className="w-8 text-center text-sm font-semibold" style={{ color: "var(--sf-text)" }}>{quantity}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    style={{ borderColor: "var(--sf-border)" }}
                    onClick={() => setLineQuantity(lineId, quantity + 1)}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
};
