"use client";

import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { useThemeVars } from "@/lib/theme-context";
import type { Category } from "@repo/types";

interface CategoriesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesModal = ({ isOpen, onOpenChange, categories, onSelectCategory }: CategoriesModalProps) => {
  const tv = useThemeVars();

  const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs rounded-2xl p-0 border-0"
        style={{ ...tv, backgroundColor: tv["--sf-card-bg"] || "#fff" } as React.CSSProperties}
      >
        <VisuallyHidden>
          <DialogTitle>Menu Categories</DialogTitle>
        </VisuallyHidden>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: tv["--sf-text"] }}>Menu</h2>
          <div className="space-y-1">
            {categories.map((category, index) => (
              <div key={category.id}>
                <button
                  onClick={() => handleSelect(category.id)}
                  className="w-full text-left py-3 px-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tv["--sf-bg-secondary"] || "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span className="font-medium text-sm" style={{ color: tv["--sf-text"] }}>
                    {category.name}
                  </span>
                  <span className="text-sm ml-1" style={{ color: tv["--sf-text-secondary"] }}>({category.items?.length || 0})</span>
                </button>
                {index < categories.length - 1 && <div className="mx-3" style={{ borderBottom: `1px solid ${tv["--sf-border"] || "#e5e7eb"}` }} />}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
