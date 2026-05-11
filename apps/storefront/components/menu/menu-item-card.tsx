"use client";

import { Plus, Minus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useCart } from "@/lib/cart-context";
import type { Item } from "@repo/types";

interface MenuItemCardProps {
  item: Item;
  onCustomize: (item: Item) => void;
}

export const MenuItemCard = ({ item, onCustomize }: MenuItemCardProps) => {
  const { addLine, getSimpleLineId, setLineQuantity, getItemTotalQuantity, lines } = useCart();
  const totalQty = getItemTotalQuantity(item.id);
  const hasVariants = (item.variants?.length ?? 0) > 0;
  const hasAddonGroups = (item.addonGroups?.length ?? 0) > 0;
  const isCustomizable = hasVariants || hasAddonGroups;

  // For customizable items, show base "from" price; for simple items, the actual price
  const displayPrice = hasVariants
    ? Math.min(...(item.variants ?? []).map((v) => v.price))
    : item.price;
  const priceInRupees = Math.round(displayPrice / 100);

  // Simple-line stepper — only used for non-customizable items
  const simpleLineId = getSimpleLineId(item.id);
  const simpleLine = lines.find((l) => l.lineId === simpleLineId);
  const simpleQty = simpleLine?.quantity ?? 0;

  const handleQuickAdd = () => {
    addLine({ item });
  };

  return (
    <div
      className="p-2 rounded-2xl hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: "var(--sf-card-bg)", border: "1px solid transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--sf-border)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      <img
        src={item.image || "/default.webp"}
        alt={item.name}
        className="w-full aspect-4/3 object-cover rounded-xl"
      />
      <div className="pt-3 space-y-1 px-1">
        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
          <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
        </div>
        <h3 className="font-medium text-sm leading-snug" style={{ color: "var(--sf-text)" }}>{item.name}</h3>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold" style={{ color: "var(--sf-text)" }}>
            {hasVariants && <span className="text-[10px] font-normal mr-1" style={{ color: "var(--sf-text-secondary)" }}>from</span>}
            ₹{priceInRupees}
          </span>

          {isCustomizable ? (
            <Button
              size="sm"
              onClick={() => onCustomize(item)}
              className="rounded-lg font-bold px-4 h-9 border"
              style={{
                backgroundColor: "var(--sf-card-bg)",
                color: "var(--sf-accent)",
                borderColor: "var(--sf-accent)",
              }}
            >
              {totalQty > 0 ? `${totalQty} • ADD` : "ADD"}
              <span className="text-[9px] ml-0.5" style={{ color: "var(--sf-accent)" }}>
                customizable
              </span>
            </Button>
          ) : simpleQty === 0 ? (
            <Button
              size="sm"
              onClick={handleQuickAdd}
              className="rounded-lg font-bold px-6 h-9 border"
              style={{
                backgroundColor: "var(--sf-card-bg)",
                color: "var(--sf-accent)",
                borderColor: "var(--sf-accent)",
              }}
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg h-9 px-1" style={{ backgroundColor: "var(--sf-accent)" }}>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:opacity-80 rounded-md"
                onClick={() => setLineQuantity(simpleLineId, simpleQty - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-white">{simpleQty}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:opacity-80 rounded-md"
                onClick={() => setLineQuantity(simpleLineId, simpleQty + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
