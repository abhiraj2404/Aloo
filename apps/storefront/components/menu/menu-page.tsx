"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShopHeader } from "./shop-header";
import { MenuCategoryPills } from "./menu-category-pills";
import { MenuItemsGrid } from "./menu-items-grid";
import { CategoriesModal } from "./categories-modal";
import { MenuFloatingButton } from "./menu-floating-button";
import { CartDrawer } from "@/components/cart";
import { OrderTracker } from "@/components/order";
import { Input } from "@repo/ui/components/input";
import { Search, ChevronDown } from "lucide-react";
import type { Category } from "@repo/types";
import { getThemeVars } from "@/lib/themes";

interface MenuPageProps {
  shopId: string;
  shopName: string;
  shopAddress: string;
  categories: Category[];
  theme?: string;
}

export const MenuPage = ({
  shopId,
  shopName,
  shopAddress,
  categories,
  theme = "classic",
}: MenuPageProps) => {
  const themeVars = getThemeVars(theme);
  const searchParams = useSearchParams();
  const tableNum = searchParams.get("table");
  const tableNumber = tableNum ? parseInt(tableNum) : null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "",
  );

  // Track which categories are expanded on mobile (first one open by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(categories[0] ? [categories[0].id] : []),
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map((category) => ({
        ...category,
        items: (category.items ?? []).filter((item) =>
          item.name.toLowerCase().includes(q),
        ),
      }))
      .filter((category) => (category.items?.length ?? 0) > 0);
  }, [categories, debouncedQuery]);

  // When searching, expand all matching categories
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setExpandedCategories(new Set(filteredCategories.map((c) => c.id)));
    }
  }, [debouncedQuery, filteredCategories]);

  useEffect(() => {
    if (!filteredCategories.length) return;
    if (filteredCategories.some((c) => c.id === activeCategoryId)) return;
    setActiveCategoryId(filteredCategories[0]?.id ?? "");
  }, [activeCategoryId, filteredCategories]);

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    // Ensure category is expanded when scrolling to it
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const handleAddItem = (itemId: string) => {};

  const handleOrderPlaced = () => {
    setOrderRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen pb-24" style={{ ...themeVars, backgroundColor: "var(--sf-bg)" } as React.CSSProperties}>
      <ShopHeader name={shopName} address={shopAddress} tableNum={tableNum} />

      {tableNumber && (
        <OrderTracker shopId={shopId} tableNumber={tableNumber} refreshKey={orderRefreshKey} />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 capitalize" style={{ color: "var(--sf-text)" }}>
          {shopName}
        </h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--sf-text-secondary)" }} />
          <Input
            placeholder="Search dishes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-0 rounded-xl h-12"
            style={{ backgroundColor: "var(--sf-bg-secondary)", color: "var(--sf-text)", "--tw-placeholder-opacity": 0.6 } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="hidden md:block sticky top-0 z-10" style={{ backgroundColor: "var(--sf-bg)", borderBottom: "1px solid var(--sf-border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <MenuCategoryPills categories={filteredCategories} activeCategoryId={activeCategoryId} onSelectCategory={scrollToCategory} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-2 md:space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--sf-text-secondary)" }}>
            No dishes found
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const itemCount = category.items?.length || 0;

            return (
              <section key={category.id} id={`category-${category.id}`} className="border-b pb-4 md:pb-8 last:border-0">
                {/* Mobile: tappable accordion header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between py-4 md:pointer-events-none"
                >
                  <h2 className="text-xl font-semibold" style={{ color: "var(--sf-text)" }}>
                    {category.name}{" "}
                    <span className="text-base font-normal" style={{ color: "var(--sf-text-secondary)" }}>
                      ({itemCount})
                    </span>
                  </h2>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 md:hidden ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Items grid — always visible on desktop, collapsible on mobile */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden md:!max-h-none md:!opacity-100 ${
                    isExpanded
                      ? "max-h-[5000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <MenuItemsGrid items={category.items ?? []} onAddItem={handleAddItem} />
                </div>
              </section>
            );
          })
        )}
      </main>

      <CartDrawer shopId={shopId} tableNumber={tableNumber} onOrderPlaced={handleOrderPlaced} />

      <MenuFloatingButton onClick={() => setIsModalOpen(true)} className="md:hidden" />
      <CategoriesModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={filteredCategories}
        onSelectCategory={scrollToCategory}
      />
    </div>
  );
};

