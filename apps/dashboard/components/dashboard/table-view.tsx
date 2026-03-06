"use client";

import { RefreshCw } from "lucide-react";
import { TableCard } from "./table-card";
import { TableLegend } from "./table-legend";
import { ActionButtons } from "./action-buttons";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import { tables } from "@/lib/dummy-data";

export function TableView() {
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
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
