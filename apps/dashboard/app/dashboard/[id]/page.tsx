"use client";

import { TableView } from "@/components/dashboard";
import { MenuView } from "@/components/menu";
import { AddCategoryForm } from "@/components/menu/add-category-form";
import { AddItemForm } from "@/components/menu/add-item-form";
import { useDashboard } from "@/lib/dashboard-context";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { X } from "lucide-react";
import { MenuService } from "@repo/api-sdk";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { isMenuMode, isAddCategoryOpen, setIsAddCategoryOpen, isAddItemOpen, setIsAddItemOpen } = useDashboard();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const getCategory = async () => {
      try {
        const res = await MenuService.getCategories();
        if (!res || res.success === false) return;
        setCategories(res.data);
      } catch {}
    };
    getCategory();
  }, []);

  return (
    <>
      {isMenuMode ? <MenuView /> : <TableView />}

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Add Category</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <DialogClose className="absolute right-3 top-3 rounded-sm p-1 text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </DialogClose>
            <AddCategoryForm />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Add Item</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <DialogClose className="absolute right-3 top-3 rounded-sm p-1 text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </DialogClose>
            <AddItemForm categories={categories} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
