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
                ? "bg-[#c3f0ca] hover:bg-[#c3f0ca]/90 text-[#33272a] font-semibold"
                : "bg-[#F1F5F9] text-[#594a4e] hover:bg-[#F1F5F9]/80 border-0"
            }`}
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};
