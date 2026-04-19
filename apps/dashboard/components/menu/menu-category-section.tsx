"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { MenuItemRow } from "./menu-item-row";
import { type Category, type Item } from "@repo/types";
type CategoryWithItems = Category & { items: Item[] };

interface MenuCategorySectionProps {
  category: CategoryWithItems;
  onToggleItem: (itemId: string, isAvailable: boolean) => void;
  onToggleCategory: (categoryId: string, isAvailable: boolean) => void;
  onEditCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  isToggling: (id: string) => boolean;
}

export function MenuCategorySection({
  category,
  onToggleItem,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  isToggling,
}: MenuCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const availableCount = category.items.filter((i) => i.isAvailable).length;
  const allAvailable = availableCount === category.items.length;

  return (
    <div className="border rounded-lg overflow-hidden min-w-max sm:min-w-0">
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
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => onEditCategory(category.id, category.name)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeleteCategory(category.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Switch
            checked={category.isActive ?? false}
            onCheckedChange={(checked) => onToggleCategory(category.id, checked)}
            disabled={isToggling(category.id)}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-2">
          {category.items.map((item) => (
            <MenuItemRow key={item.id} item={item} onToggle={onToggleItem} onEdit={onEditItem} onDelete={onDeleteItem} isToggling={isToggling(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
