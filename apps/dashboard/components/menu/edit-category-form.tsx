"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Logo } from "@/components/shared";
import { MenuService } from "@repo/api-sdk";
import { useState } from "react";
import { type Category } from "@repo/types";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

type EditCategoryFormProps = {
  category: Category;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditCategoryForm({ category, onSuccess, onCancel }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await MenuService.updateCategory(category.id, name, undefined, category.menuId);
      if (!res || res.success === false) {
        const msg = res?.message || res?.error || "Internal server error!";
        toastError(msg);
        return;
      }
      success("Category updated successfully!");
      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.errors?.[0] || error?.response?.data?.message || "Internal server error!";
      toastError(msg);
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
        <CardTitle>Edit Category</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
            />
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