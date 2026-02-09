"use client";

import { useEffect } from "react";

interface CategoryItem {
  id: string;
  name: string;
  itemCount?: number;
}

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  currentCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Bottom sheet overlay for category selection (mobile only)
 */
export const CategorySheet = ({
  isOpen,
  onClose,
  categories,
  currentCategoryId,
  onSelectCategory,
}: CategorySheetProps) => {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Bottom Left, Compact */}
      <div
        className="fixed bottom-6 left-6 bg-black rounded-2xl z-50 w-72 max-h-96 overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Categories list with scroller */}
        <div className="flex-1 overflow-y-auto py-4">
          {categories.map((category) => {
            const isSelected = category.id === currentCategoryId;
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  onSelectCategory(category.id);
                  onClose();
                }}
                className={`w-full px-6 py-3 flex items-center justify-between text-white hover:bg-gray-800 transition-colors ${
                  isSelected ? "bg-gray-800" : ""
                }`}
              >
                <span className="text-base font-normal">{category.name}</span>
                {category.itemCount !== undefined && (
                  <span className="text-base text-gray-400 font-normal">{category.itemCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
