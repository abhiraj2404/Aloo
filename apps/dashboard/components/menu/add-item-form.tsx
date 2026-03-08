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
import { Plus } from "lucide-react";

type CategoryOption = {
  id: string;
  name: string;
};

type AddItemFormProps = {
  categories: CategoryOption[];
};

export function AddItemForm({ categories }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState("");
  const maxPrice = 999999.99;

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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

    try {
      const res = await MenuService.addItem({
        name,
        price: Number(price),
        categoryId,
        isVeg,
        image:"",
      });

      if (!res || res.success === false) {
        const msg = res?.message || res?.error || "Internal server error!";
        setError(msg);
        return;
      }

      setName("");
      setPrice("");
      setCategoryId("");
      setIsVeg(true);
      setImage(undefined);
      setPreviewUrl("");
      setError("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Internal server error!";
      setError(msg);
    }
  };

  return (
    <Card className="w-full max-w-md border border-gray-200 shadow-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <Logo className="text-red-500" />
        <CardTitle className="text-lg ">Add Item</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-600">Image</Label>
            <label className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer bg-gray-50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
              ) : (
                <Plus className="h-10 w-10 text-gray-400" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || undefined)} />
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-600">Item name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paneer Tikka" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-gray-600">Price</Label>
            <Input
              id="price"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-gray-600">Veg</Label>
            <Switch
              className="border border-gray-400 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              checked={isVeg}
              onCheckedChange={setIsVeg}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-red-500 mt-4 hover:bg-red-600">Submit</Button>
        </CardFooter>
      </form>
    </Card>
  );
}