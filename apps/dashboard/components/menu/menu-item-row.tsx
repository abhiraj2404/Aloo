"use client";

import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/utils";
import type { MenuItem } from "@/lib/menu-data";

interface MenuItemRowProps {
  item: MenuItem;
  onToggle: (itemId: string, isAvailable: boolean) => void;
}

export function MenuItemRow({ item, onToggle }: MenuItemRowProps) {
  const priceInRupees = Math.round(item.price / 100);

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        item.isAvailable ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-4 h-4 rounded-sm flex items-center justify-center border",
            item.isVeg ? "border-green-600" : "border-red-600"
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              item.isVeg ? "bg-green-600" : "bg-red-600"
            )}
          />
        </div>
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">₹{priceInRupees}</p>
        </div>
      </div>
      <Switch
        checked={item.isAvailable}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
      />
    </div>
  );
}
