"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import type { Category } from "@repo/types";

interface MenuCategorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const MenuCategorySheet = ({
  isOpen,
  onOpenChange,
  categories,
  activeCategoryId,
  onSelectCategory,
}: MenuCategorySheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-72 bg-black border-none p-0 gap-0"
      >
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="text-white text-lg">Categories</SheetTitle>
        </SheetHeader>
        <Separator className="bg-gray-800" />
        <div className="flex-1 overflow-y-auto py-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              onClick={() => {
                onSelectCategory(category.id);
                onOpenChange(false);
              }}
              className={`w-full justify-start rounded-none px-6 py-3 h-auto text-white hover:bg-gray-800 hover:text-white ${
                category.id === activeCategoryId ? "bg-gray-800" : ""
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
