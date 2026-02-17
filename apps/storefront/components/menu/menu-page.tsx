"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShopHeader } from "./shop-header";
import { MenuCategoryPills } from "./menu-category-pills";
import { MenuItemsGrid } from "./menu-items-grid";
import { MenuCategorySheet } from "./menu-category-sheet";
import { MenuFloatingButton } from "./menu-floating-button";
import { Separator } from "@repo/ui/components/separator";
import type { Category } from "@repo/types";

interface MenuPageProps {
  shopName: string;
  shopAddress: string;
  categories: Category[];
}

export const MenuPage = ({
  shopName,
  shopAddress,
  categories,
}: MenuPageProps) => {
  const searchParams = useSearchParams();
  const tableNum = searchParams.get("table");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "",
  );

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      const offset = 80; // account for sticky nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const handleAddItem = (itemId: string) => {
    // TODO: Implement cart functionality
    console.log("Add item:", itemId);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-8 bg-gray-50">
      <ShopHeader name={shopName} address={shopAddress} tableNum={tableNum} />

      {/* Sticky category nav */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <MenuCategoryPills
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={scrollToCategory}
          />
        </div>
      </div>

      {/* Full menu by category */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {category.name}
            </h2>
            <MenuItemsGrid
              items={category.items ?? []}
              onAddItem={handleAddItem}
            />
            <Separator className="mt-10" />
          </section>
        ))}
      </main>

      {/* Mobile: floating button + sheet */}
      <MenuFloatingButton
        onClick={() => setIsSheetOpen(true)}
        className="md:hidden"
      />
      <MenuCategorySheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={scrollToCategory}
      />
    </div>
  );
};
