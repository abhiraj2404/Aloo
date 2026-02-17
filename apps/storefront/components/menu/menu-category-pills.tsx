"use client";

import { Button } from "@repo/ui/components/button";
import type { Category } from "@repo/types";

interface MenuCategoryPillsProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const MenuCategoryPills = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}: MenuCategoryPillsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;

        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(category.id)}
            className={`rounded-full whitespace-nowrap ${
              isActive
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};
