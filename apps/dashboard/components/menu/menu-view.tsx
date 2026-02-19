"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { Label } from "@repo/ui/components/label";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Badge } from "@repo/ui/components/badge";
import { MenuCategorySection } from "./menu-category-section";
import { dummyMenuCategories, type MenuCategory } from "@/lib/menu-data";

export function MenuView() {
  const [categories, setCategories] = useState<MenuCategory[]>(dummyMenuCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(true);

  const stats = useMemo(() => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const availableItems = categories.reduce(
      (acc, cat) => acc + cat.items.filter((i) => i.isAvailable).length,
      0
    );
    return { totalItems, availableItems, unavailableItems: totalItems - availableItems };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = categories;

    if (q) {
      result = result
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.name.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.items.length > 0);
    }

    if (!showUnavailable) {
      result = result
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => item.isAvailable),
        }))
        .filter((cat) => cat.items.length > 0);
    }

    return result;
  }, [categories, searchQuery, showUnavailable]);

  const handleToggleItem = (itemId: string, isAvailable: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId ? { ...item, isAvailable } : item
        ),
      }))
    );
  };

  const handleToggleCategory = (categoryId: string, isAvailable: boolean) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.map((item) => ({ ...item, isAvailable })) }
          : cat
      )
    );
  };

  const handleToggleAll = (isAvailable: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item, isAvailable })),
      }))
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Menu Management</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex gap-2 ml-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {stats.availableItems} Available
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {stats.unavailableItems} Unavailable
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-unavailable"
              checked={showUnavailable}
              onCheckedChange={setShowUnavailable}
            />
            <Label htmlFor="show-unavailable" className="text-sm">
              Show unavailable
            </Label>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(true)}
              className="text-green-600 border-green-600"
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(false)}
              className="text-red-600 border-red-600"
            >
              Disable All
            </Button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-4 pb-4">
          {filteredCategories.map((category) => (
            <MenuCategorySection
              key={category.id}
              category={category}
              onToggleItem={handleToggleItem}
              onToggleCategory={handleToggleCategory}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No items found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
