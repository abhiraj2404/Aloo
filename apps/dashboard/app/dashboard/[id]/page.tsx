"use client";

import { TableView } from "@/components/dashboard";
import { MenuView } from "@/components/menu";
import { OrdersView, NewOrderForm } from "@/components/orders";
import { BillsView } from "@/components/bills";
import { SettingsView } from "@/components/settings";
import { AnalyticsView } from "@/components/analytics";
import { AddCategoryForm } from "@/components/menu/add-category-form";
import { AddItemForm } from "@/components/menu/add-item-form";
import { useDashboard } from "@/lib/dashboard-context";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { MenuService } from "@repo/api-sdk";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  const { activeMode, isAddCategoryOpen, setIsAddCategoryOpen, isAddItemOpen, setIsAddItemOpen, isNewOrderOpen, setIsNewOrderOpen, userRole } = useDashboard();
  const [categories, setCategories] = useState([]);
  const id = useParams().id as string;
  if(!id){
    console.log(["dashboardPage"],"Unable to get shopId");
    return ;
  }

  const refreshCategories = async () => {
    try {
      const res = await MenuService.getCategories();
      if (!res || res.success === false) return;
      setCategories(res.data);
    } catch {}
  };

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

  const renderView = () => {
    switch (activeMode) {
      case "analytics":
        return userRole === "OWNER" ? <AnalyticsView /> : <TableView id={id} />;
      case "menu":
        return <MenuView shopId={id} />;
      case "orders":
        return <OrdersView shopId={id} />;
      case "bills":
        return  <BillsView shopId={id} />;
      case "settings":
        return userRole === "OWNER" ? <SettingsView /> : <TableView id={id} />;
      default:
        return <TableView id={id} />;
    }
  };

  return (
    <>
      {renderView()}

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Add Category</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <AddCategoryForm onSuccess={() => {
              refreshCategories();
              setIsAddCategoryOpen(false);
            }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Add Item</DialogTitle>
          </VisuallyHidden>
          <div className="relative">
            <AddItemForm categories={categories} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none max-w-lg">
          <VisuallyHidden>
            <DialogTitle>New Order</DialogTitle>
          </VisuallyHidden>
          <NewOrderForm
            shopId={id}
            onSuccess={() => setIsNewOrderOpen(false)}
            onCancel={() => setIsNewOrderOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
