"use client";

import { Dialog, DialogContent } from "@repo/ui/components/dialog";
import type { Category } from "@repo/types";

interface CategoriesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesModal = ({ isOpen, onOpenChange, categories, onSelectCategory }: CategoriesModalProps) => {
  const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-xs rounded-2xl p-0 border-0">
        <div className="p-4">
          <h2 className="text-lg font-bold text-[#33272a] mb-4">Menu</h2>
          <div className="space-y-1">
            {categories.map((category, index) => (
              <div key={category.id}>
                <button
                  onClick={() => handleSelect(category.id)}
                  className="w-full text-left py-3 px-3 hover:bg-[#F1F5F9] rounded-xl transition-colors"
                >
                  <span className="text-[#33272a] font-medium text-sm">
                    {category.name}
                  </span>
                  <span className="text-[#8a8a8a] text-sm ml-1">({category.items?.length || 0})</span>
                </button>
                {index < categories.length - 1 && <div className="border-b border-gray-100 mx-3" />}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
