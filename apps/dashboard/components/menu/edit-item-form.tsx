"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Button } from "@repo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Logo } from "@/components/shared";
import { MenuService, AddonGroupService } from "@repo/api-sdk";
import { type Item, type Category, type AddonGroup, type ItemVariant } from "@repo/types";
import { useToast } from "@/lib/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/image-upload";

type EditItemFormProps = {
  item: Item;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
};

type VariantRow = { id?: string; name: string; price: string };

const variantToRow = (v: ItemVariant): VariantRow => ({
  id: v.id,
  name: v.name,
  price: (v.price / 100).toString(),
});

export function EditItemForm({ item, categories, onSuccess, onCancel }: EditItemFormProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState((item.price / 100).toString());
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [isVeg, setIsVeg] = useState(item.isVeg);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>(item.image || "");
  const [imageUrl] = useState<string>(item.image || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const maxPrice = 999999.99;
  const { success, error: toastError } = useToast();

  // Variants — local state diff'd against item.variants on save
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    (item.variants ?? []).map(variantToRow),
  );

  // Addon groups
  const [allGroups, setAllGroups] = useState<AddonGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [attachedGroupIds, setAttachedGroupIds] = useState<Set<string>>(
    new Set((item.addonGroups ?? []).map((g) => g.id)),
  );

  useEffect(() => {
    if (!image) {
      setPreviewUrl(item.image || "");
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image, item.image]);

  // Lazy-load all addon groups for the picker
  useEffect(() => {
    setGroupsLoading(true);
    AddonGroupService.list()
      .then(setAllGroups)
      .catch(() => setAllGroups([]))
      .finally(() => setGroupsLoading(false));
  }, []);

  const handlePriceChange = (value: string) => {
    if (value === "") {
      setPrice(value);
      setError("");
      return;
    }
    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      setError("Price must have at most 2 decimal places");
      return;
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      setError("Invalid price");
      return;
    }
    if (numericValue > maxPrice) {
      setError("Price is too large");
      return;
    }
    setError("");
    setPrice(value);
  };

  const updateVariantRow = (i: number, patch: Partial<VariantRow>) => {
    setVariantRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addVariantRow = () => setVariantRows((prev) => [...prev, { name: "", price: "" }]);
  const removeVariantRow = (i: number) => setVariantRows((prev) => prev.filter((_, idx) => idx !== i));

  const toggleAttachedGroup = (id: string) => {
    setAttachedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d*(\.\d{0,2})?$/.test(price)) {
      setError("Price must have at most 2 decimal places");
      return;
    }
    if (Number(price) > maxPrice) {
      setError("Price is too large");
      return;
    }

    // Validate variant rows (rows with at least one of name/price filled)
    const trimmedVariants = variantRows.filter((v) => v.name.trim() !== "" || v.price !== "");
    for (const v of trimmedVariants) {
      if (!v.name.trim()) {
        setError("Each variant needs a name");
        return;
      }
      const p = Number(v.price);
      if (Number.isNaN(p) || p < 0) {
        setError(`Variant "${v.name}" has an invalid price`);
        return;
      }
    }

    setIsLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (image) {
        try {
          finalImageUrl = await uploadImageToCloudinary(image);
        } catch {
          toastError("Failed to upload image");
          return;
        }
      }

      // 1. Update item base fields
      const res = await MenuService.updateItem(item.id, item.shopId, {
        name,
        price: Number(price),
        categoryId,
        isVeg,
        image: finalImageUrl || undefined,
      });

      if (!res || res.success === false) {
        const msg = res?.message || res?.error || "Internal server error!";
        toastError(msg);
        return;
      }

      // 2. Sync variants — diff existing vs new
      const existingIds = new Set((item.variants ?? []).map((v) => v.id));
      const incomingIds = new Set(trimmedVariants.filter((v) => v.id).map((v) => v.id!));
      const toDelete = (item.variants ?? []).filter((v) => !incomingIds.has(v.id));
      const variantOps: Promise<unknown>[] = [];
      for (const v of toDelete) variantOps.push(MenuService.deleteVariant(v.id));
      for (const v of trimmedVariants) {
        const priceInt = Math.round(Number(v.price) * 100);
        if (v.id && existingIds.has(v.id)) {
          variantOps.push(MenuService.updateVariant(v.id, { name: v.name.trim(), price: priceInt }));
        } else if (!v.id) {
          variantOps.push(MenuService.createVariant(item.id, { name: v.name.trim(), price: priceInt }));
        }
      }
      await Promise.all(variantOps);

      // 3. Sync attached addon groups
      const originalAttached = new Set((item.addonGroups ?? []).map((g) => g.id));
      const newAttached = attachedGroupIds;
      const changed =
        originalAttached.size !== newAttached.size ||
        Array.from(originalAttached).some((id) => !newAttached.has(id));
      if (changed) {
        await MenuService.setItemAddonGroups(item.id, Array.from(newAttached));
      }

      success("Item updated successfully!");
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Internal server error!";
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md max-h-[85vh] flex flex-col">
      <CardHeader className="text-center shrink-0">
        <div className="flex justify-center mb-2">
          <Logo className="text-red-500" />
        </div>
        <CardTitle>Edit Item</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4" id="edit-item-form">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter item name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Base Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Used when no variants. With variants, each variant's price replaces this.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <label className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer bg-gray-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <Plus className="h-10 w-10 text-gray-400" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || undefined)} />
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isVeg" checked={isVeg} onCheckedChange={setIsVeg} />
              <Label htmlFor="isVeg">Vegetarian</Label>
            </div>

            {/* ── Variants ─────────────────────────────────────── */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Variations</Label>
                <span className="text-xs text-gray-500">e.g. Half / Full, Small / Large</span>
              </div>
              {variantRows.length === 0 && (
                <p className="text-xs text-gray-500">No variants — base price is used.</p>
              )}
              <div className="space-y-2">
                {variantRows.map((v, i) => (
                  <div key={v.id ?? i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Name (e.g. Full Plate)"
                      value={v.name}
                      onChange={(e) => updateVariantRow(i, { name: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="₹0"
                      value={v.price}
                      onChange={(e) => updateVariantRow(i, { price: e.target.value })}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-gray-400 hover:text-red-600"
                      onClick={() => removeVariantRow(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addVariantRow}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add variant
              </Button>
            </div>

            {/* ── Addon Groups picker ──────────────────────────── */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Add-on Groups</Label>
                <span className="text-xs text-gray-500">Reusable extras attached to this item</span>
              </div>
              {groupsLoading ? (
                <div className="py-4 flex justify-center text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : allGroups.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No addon groups yet. Create one from <span className="font-medium">Manage Add-ons</span>.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
                  {allGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-start gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={attachedGroupIds.has(g.id)}
                        onChange={() => toggleAttachedGroup(g.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{g.name}</span>
                          <span className="text-[10px] text-gray-500">
                            {g.minSelect > 0 ? "Required" : "Optional"} · min {g.minSelect}/max {g.maxSelect}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {(g.addons ?? []).map((a) => a.name).join(", ") || "—"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </CardContent>
      <CardFooter className="border-t pt-4 shrink-0">
        <div className="flex gap-2 w-full">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-item-form" className="flex-1" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
