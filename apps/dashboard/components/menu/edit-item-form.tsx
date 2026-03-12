"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Button } from "@repo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Logo } from "@/components/shared";
import { MenuService } from "@repo/api-sdk";
import { type Item, type Category } from "@repo/types";

type EditItemFormProps = {
  item: Item;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditItemForm({ item, categories, onSuccess, onCancel }: EditItemFormProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState((item.price / 100).toString());
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [isVeg, setIsVeg] = useState(item.isVeg);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const maxPrice = 999999.99;

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

    setIsLoading(true);
    try {
      const res = await MenuService.updateItem(item.id, item.shopId, {
        name,
        price: Number(price),
        categoryId,
        isVeg,
      });

      if (!res || res.success === false) {
        const msg = res?.message || res?.error || "Internal server error!";
        setError(msg);
        return;
      }

      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.errors?.[0] || error?.response?.data?.message || "Internal server error!";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Logo className="text-red-500" />
        </div>
        <CardTitle>Edit Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
            />
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
          <div className="flex items-center space-x-2">
            <Switch id="isVeg" checked={isVeg} onCheckedChange={setIsVeg} />
            <Label htmlFor="isVeg">Vegetarian</Label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}