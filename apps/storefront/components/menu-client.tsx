"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingMenuButton } from "./floating-menu-button";
import { CategorySheet } from "./category-sheet";
import { CategoryPills } from "./category-pills";
import { ItemsGrid } from "./items-grid";

interface Shop {
  id: string;
  name: string;
  address: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  image: string | null;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
  orderIndex: number;
}

interface CurrentCategory extends Category {
  items: Item[];
}

interface MenuClientProps {
  shop: Shop;
  currentCategory: CurrentCategory;
  allCategories: Category[];
  shopId: string;
}

/**
 * Client-side menu component with category navigation
 */
export const MenuClient = ({
  shop,
  currentCategory,
  allCategories,
  shopId,
}: MenuClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const tableNum = searchParams.get("table");

  const handleSelectCategory = (categoryId: string) => {
    // Build URL with table param if present
    const params = new URLSearchParams();
    if (tableNum) {
      params.set("table", tableNum);
    }
    params.set("category", categoryId);

    router.push(`/menu/${shopId}?${params.toString()}`);
  };

  const handleAddItem = (itemId: string) => {
    // TODO: Implement cart functionality
    console.log("Add item:", itemId);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-8 bg-gray-50">
      {/* Shop Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-1 text-gray-900">{shop.name}</h1>
          <p className="text-sm text-gray-500">{shop.address}</p>
          {tableNum && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              <span>Table {tableNum}</span>
            </div>
          )}
        </div>
      </header>

      {/* Category Pills - Desktop Only */}
      <div className="hidden md:block bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <CategoryPills
            categories={allCategories}
            currentCategoryId={currentCategory.id}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      </div>

      {/* Current Category & Items */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{currentCategory.name}</h2>
        
        <ItemsGrid items={currentCategory.items} onAddItem={handleAddItem} />
      </main>

      {/* Floating Menu Button - Mobile Only */}
      <FloatingMenuButton
        onClick={() => setIsSheetOpen(prev => !prev)}
        className="md:hidden"
      />

      {/* Category Sheet - Mobile Only */}
      <CategorySheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        categories={allCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
        }))}
        currentCategoryId={currentCategory.id}
        onSelectCategory={handleSelectCategory}
      />
    </div>
  );
};
