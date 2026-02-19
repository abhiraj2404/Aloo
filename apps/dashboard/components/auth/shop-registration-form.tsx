"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/shared";

interface TableCategoryInput {
  name: string;
  tableCount: number;
}

export function ShopRegistrationForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [categories, setCategories] = useState<TableCategoryInput[]>([
    { name: "A/C", tableCount: 10 },
    { name: "Non A/C", tableCount: 5 },
  ]);

  const addCategory = () => {
    setCategories([...categories, { name: "", tableCount: 1 }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof TableCategoryInput, value: string | number) => {
    setCategories(prev => prev.map((cat, i) => {
      if (i !== index) return cat;
      return { ...cat, [field]: value };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Logo className="text-red-500" />
        </div>
        <CardTitle className="text-xl font-bold">Setup Your Shop</CardTitle>
        <CardDescription>Configure your restaurant details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              placeholder="Enter shop name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopAddress">Address</Label>
            <Input
              id="shopAddress"
              placeholder="Enter shop address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Table Categories</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            
            {categories.map((cat, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Category name"
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Tables"
                  value={cat.tableCount}
                  onChange={(e) => updateCategory(index, "tableCount", parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
