"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { MenuItemRow } from "./menu-item-row";
import type { MenuCategory, MenuItem } from "@/lib/menu-data";

interface MenuCategorySectionProps {
  category: MenuCategory;
  onToggleItem: (itemId: string, isAvailable: boolean) => void;
  onToggleCategory: (categoryId: string, isAvailable: boolean) => void;
}

export function MenuCategorySection({
  category,
  onToggleItem,
  onToggleCategory,
}: MenuCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const availableCount = category.items.filter((i) => i.isAvailable).length;
  const allAvailable = availableCount === category.items.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="font-semibold">{category.name}</span>
          <span className="text-xs text-gray-500">
            ({availableCount}/{category.items.length} available)
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={allAvailable}
            onCheckedChange={(checked) => onToggleCategory(category.id, checked)}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-2">
          {category.items.map((item) => (
            <MenuItemRow key={item.id} item={item} onToggle={onToggleItem} />
          ))}
        </div>
      )}
    </div>
  );
}
