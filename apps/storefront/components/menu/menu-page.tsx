"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShopHeader } from "./shop-header";
import { MenuCategoryPills } from "./menu-category-pills";
import { MenuItemsGrid } from "./menu-items-grid";
import { CategoriesModal } from "./categories-modal";
import { MenuFloatingButton } from "./menu-floating-button";
import { Input } from "@repo/ui/components/input";
import { Search } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <div className="min-h-screen pb-8 bg-white">
      <ShopHeader name={shopName} address={shopAddress} tableNum={tableNum} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#33272a] mb-6 capitalize">
          {shopName}
        </h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#594a4e]" />
          <Input
            placeholder="Search dishes"
            className="pl-10 bg-[#F1F5F9] border-0 rounded-xl text-[#594a4e] placeholder:text-[#594a4e]/60 h-12"
          />
        </div>
      </div>

      <div className="hidden md:block bg-white sticky top-0 z-10 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <MenuCategoryPills categories={categories} activeCategoryId={activeCategoryId} onSelectCategory={scrollToCategory} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="border-b pb-8 last:border-0">
            <h2 className="text-xl font-semibold text-[#33272a] py-4">
              {category.name} ({category.items?.length || 0})
            </h2>
            <MenuItemsGrid items={category.items ?? []} onAddItem={handleAddItem} />
          </section>
        ))}
      </main>

      <MenuFloatingButton onClick={() => setIsModalOpen(true)} className="md:hidden" />
      <CategoriesModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        onSelectCategory={scrollToCategory}
      />
    </div>
  );
};
