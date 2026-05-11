"use client";

import { useState } from "react";
import { MenuItemCard } from "./menu-item-card";
import { ItemCustomizer } from "./item-customizer";
import type { Item } from "@repo/types";

interface MenuItemsGridProps {
  items: Item[];
  onAddItem?: (itemId: string) => void;
}

export const MenuItemsGrid = ({ items }: MenuItemsGridProps) => {
  const [customizingItem, setCustomizingItem] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const handleCustomize = (item: Item) => {
    setCustomizingItem(item);
    setOpen(true);
  };

  if (items.length === 0) {
    return <div className="text-center py-12" style={{ color: "var(--sf-text-secondary)" }}>No items available</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} onCustomize={handleCustomize} />
        ))}
      </div>
      <ItemCustomizer item={customizingItem} open={open} onOpenChange={setOpen} />
    </>
  );
};
