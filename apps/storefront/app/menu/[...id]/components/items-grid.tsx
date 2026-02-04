"use client";

import { MenuItemCard } from "./menu-item-card";

interface Item {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  image: string | null;
  isAvailable: boolean;
}

interface ItemsGridProps {
  items: Item[];
  onAddItem: (itemId: string) => void;
}

/**
 * Responsive grid layout for menu items
 * Mobile: 2-column vertical cards
 * Desktop: horizontal cards
 */
export const ItemsGrid = ({ items, onAddItem }: ItemsGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No items available in this category
      </div>
    );
  }

  return (
    <>
      {/* Mobile: 2-column grid with vertical cards */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            price={item.price}
            isVeg={item.isVeg}
            image={item.image}
            isAvailable={item.isAvailable}
            onAdd={onAddItem}
            layout="vertical"
          />
        ))}
      </div>

      {/* Desktop: 4-column grid with vertical cards */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            price={item.price}
            isVeg={item.isVeg}
            image={item.image}
            isAvailable={item.isAvailable}
            onAdd={onAddItem}
            layout="vertical"
          />
        ))}
      </div>
    </>
  );
};
