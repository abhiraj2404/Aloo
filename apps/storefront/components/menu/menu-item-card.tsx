"use client";

import { Plus, Minus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useCart } from "@/lib/cart-context";
import type { Item } from "@repo/types";

interface MenuItemCardProps extends Pick<Item, "id" | "name" | "price" | "isVeg" | "image"> {
  onAdd: (itemId: string) => void;
}

export const MenuItemCard = ({ id, name, price, isVeg, image, onAdd }: MenuItemCardProps) => {
  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const quantity = getItemQuantity(id);
  const priceInRupees = Math.round(price / 100);

  const handleAdd = () => {
    onAdd(id);
    addItem({ id, name, price, isVeg, image, shopId: "", categoryId: "" });
  };

  return (
    <div
      className="p-2 rounded-2xl hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: "var(--sf-card-bg)", border: "1px solid transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--sf-border)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      <img
        src={image || "/default.webp"}
        alt={name}
        className="w-full aspect-4/3 object-cover rounded-xl"
      />
      <div className="pt-3 space-y-1 px-1">
        {/* Veg/Non-veg indicator — stays fixed, not themed */}
        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
        </div>
        <h3 className="font-medium text-sm leading-snug" style={{ color: "var(--sf-text)" }}>{name}</h3>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold" style={{ color: "var(--sf-text)" }}>₹{priceInRupees}</span>
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={handleAdd}
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
                onClick={() => updateQuantity(id, quantity - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-white">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:opacity-80 rounded-md"
                onClick={() => updateQuantity(id, quantity + 1)}
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
