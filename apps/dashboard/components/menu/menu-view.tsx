"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, RefreshCw, Settings2 } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { Label } from "@repo/ui/components/label";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Badge } from "@repo/ui/components/badge";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { MenuCategorySection } from "./menu-category-section";
import { EditCategoryForm } from "./edit-category-form";
import { EditItemForm } from "./edit-item-form";
import { AddonGroupsManager } from "./addon-groups-manager";
import { MenuService } from "@repo/api-sdk";
import { type Category, type Item } from "@repo/types";
import { useToast } from "@/lib/use-toast";

type CategoryWithItems = Category & { items: Item[] };

export function MenuView({ shopId }: { shopId: string }) {
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnavailable, setShowUnavailable] = useState(true);
  const [editCategoryDialog, setEditCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: string; name: string; menuId?: string; shopId?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());
  const [addonsManagerOpen, setAddonsManagerOpen] = useState(false);

  const { success, error } = useToast();

  const fetchMenu = async () => {
    try {
      const res = await MenuService.getMenuByShopId(shopId);
      if (!res || !res?.categories) {
        console.log(['MenuView'], "unable to fetch menu");
        //todo:error
        return;
      }
      setCategories((
        res.categories.map(c => ({
          ...c,
          items: c.items ?? []
        }))
      ));
    }
    catch (e: any) {
      console.log(["MenuView"], e?.response);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [shopId])

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

  const handleToggleItem = async (itemId: string, isAvailable: boolean) => {
    const item = categories.flatMap(cat => cat.items).find(i => i.id === itemId);
    if (!item) return;
    setTogglingItems(prev => new Set(prev).add(itemId));
    try {
      await MenuService.toggleItemAvailability(itemId, item.shopId, isAvailable);
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, isAvailable } : item
          ),
        }))
      );
      success(`Item "${item.name}" ${isAvailable ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error("Failed to toggle item:", err);
      error(`Failed to ${isAvailable ? 'enable' : 'disable'} item "${item.name}"`);
    } finally {
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleToggleCategory = async (categoryId: string, isAvailable: boolean) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    setTogglingItems(prev => new Set(prev).add(categoryId));
    try {
      await MenuService.toggleCategoryAvailability(categoryId, category.menuId, isAvailable);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? { ...cat, isActive: isAvailable, items: cat.items.map((item) => ({ ...item, isAvailable })) }
            : cat
        )
      );
      success(`Category "${category.name}" ${isAvailable ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error("Failed to toggle category:", err);
      error(`Failed to ${isAvailable ? 'enable' : 'disable'} category "${category.name}"`);
    } finally {
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  const handleEditCategory = (categoryId: string, currentName: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setEditCategoryDialog(true);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setDeleteTarget({ type: 'category', id: categoryId, name: category.name, menuId: category.menuId });
      setDeleteDialog(true);
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = categories.flatMap(cat => cat.items).find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setEditItemDialog(true);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const item = categories.flatMap(cat => cat.items).find(i => i.id === itemId);
    if (item) {
      setDeleteTarget({ type: 'item', id: itemId, name: item.name, shopId: item.shopId });
      setDeleteDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'category') {
        await MenuService.deleteCategory(deleteTarget.id, deleteTarget.menuId!);
        setCategories((prev) => prev.filter((cat) => cat.id !== deleteTarget.id));
        success(`Category "${deleteTarget.name}" deleted successfully`);
      } else {
        await MenuService.deleteItem(deleteTarget.id, deleteTarget.shopId!);
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => item.id !== deleteTarget.id),
          }))
        );
        success(`Item "${deleteTarget.name}" deleted successfully`);
      }
      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete:", err);
      error(`Failed to delete ${deleteTarget.type} "${deleteTarget.name}"`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setEditCategoryDialog(false);
    setSelectedCategory(null);
    setEditItemDialog(false);
    setSelectedItem(null);
    // Refetch or update state
    fetchMenu();
    success("Changes saved successfully");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Menu Management</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchMenu}>
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
        <Button size="sm" variant="outline" onClick={() => setAddonsManagerOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Manage Add-ons
        </Button>
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
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              isToggling={(id) => togglingItems.has(id)}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No items found
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={editCategoryDialog} onOpenChange={setEditCategoryDialog}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Edit Category</DialogTitle>
          </VisuallyHidden>
          {selectedCategory && (
            <EditCategoryForm
              category={selectedCategory}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditCategoryDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editItemDialog} onOpenChange={setEditItemDialog}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Edit Item</DialogTitle>
          </VisuallyHidden>
          {selectedItem && (
            <EditItemForm
              item={selectedItem}
              categories={categories}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditItemDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AddonGroupsManager open={addonsManagerOpen} onOpenChange={setAddonsManagerOpen} />

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </VisuallyHidden>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Delete {deleteTarget?.type}</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="flex-1" disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} className="flex-1" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
