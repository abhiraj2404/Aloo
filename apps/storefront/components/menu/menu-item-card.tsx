"use client";

import { Button } from "@repo/ui/components/button";
import type { Item } from "@repo/types";

interface MenuItemCardProps extends Pick<Item, "id" | "name" | "price" | "isVeg" | "image"> {
  onAdd: (itemId: string) => void;
}

export const MenuItemCard = ({ id, name, price, isVeg, image, onAdd }: MenuItemCardProps) => {
  const priceInRupees = Math.round(price / 100);

  return (
    <div className="bg-white p-2 rounded-2xl hover:scale-[1.02] hover:border hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
      <img
        src={image || "/default.png"}
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
          <Button
            size="sm"
            onClick={() => onAdd(id)}
            className="bg-white hover:bg-gray-50 text-green-600 border border-green-600 rounded-lg font-bold px-6 h-9"
          >
            ADD
          </Button>
        </div>
      </div>
    </div>
  );
};
