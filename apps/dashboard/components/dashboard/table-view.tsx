"use client";

import { RefreshCw } from "lucide-react";
import { tables, tableCategories } from "@/lib/dummy-data";
import { TableCategorySection } from "./table-category-section";
import { TableLegend } from "./table-legend";
import { ActionButtons } from "./action-buttons";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";

export function TableView() {
  const getTablesByCategory = (categoryId: string) => {
    return tables.filter((t) => t.categoryId === categoryId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Table View</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <TableLegend />
      </div>
      
      <ActionButtons />
      
      <ScrollArea className="flex-1">
        <div className="pr-4 pb-4">
          {tableCategories.map((category) => (
            <TableCategorySection
              key={category.id}
              categoryName={category.name}
              tables={getTablesByCategory(category.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
