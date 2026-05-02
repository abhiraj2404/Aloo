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
            className="rounded-full whitespace-nowrap border-0 font-semibold"
            style={
              isActive
                ? { backgroundColor: "var(--sf-accent-light)", color: "var(--sf-text)" }
                : { backgroundColor: "var(--sf-bg-secondary)", color: "var(--sf-text-secondary)" }
            }
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
};
