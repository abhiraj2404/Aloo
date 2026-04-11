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
    <div className="bg-white p-2 rounded-2xl hover:scale-[1.02] hover:border hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
      <img
        src={image || "/default.webp"}
        alt={name}
        className="w-full aspect-4/3 object-cover rounded-xl"
      />
      <div className="pt-3 space-y-1 px-1">
        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
        </div>
        <h3 className="font-medium text-sm text-[#33272a] leading-snug">{name}</h3>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-[#33272a]">₹{priceInRupees}</span>
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={handleAdd}
              className="bg-white hover:bg-gray-50 text-green-600 border border-green-600 rounded-lg font-bold px-6 h-9"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-1 bg-green-600 rounded-lg h-9 px-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:bg-green-700 rounded-md"
                onClick={() => updateQuantity(id, quantity - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-bold text-white">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:bg-green-700 rounded-md"
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
