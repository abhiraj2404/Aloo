"use client";

import { MenuItemCard } from "./menu-item-card";
import type { Item } from "@repo/types";

interface MenuItemsGridProps {
  items: Item[];
  onAddItem: (itemId: string) => void;
}

export const MenuItemsGrid = ({ items, onAddItem }: MenuItemsGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No items available in this category
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <MenuItemCard key={item.id} {...item} onAdd={onAddItem} />
      ))}
    </div>
  );
};
