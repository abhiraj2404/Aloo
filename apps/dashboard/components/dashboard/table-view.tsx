"use client";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { TableCard } from "./table-card";
import { TableLegend } from "./table-legend";
import { ActionButtons } from "./action-buttons";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import { TableService } from "@repo/api-sdk";
import { useParams } from "next/navigation";
import { type Table } from "@repo/types";

export function TableView() {
  const id = useParams().id as string;
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);

  const gridCols = 6;

  const fetchTables = async () => {
    setLoading(true);
    try {
      const result = await TableService.getAllTables(id);
      // Ensure result is an array
      setTables(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setTables([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [id]); 

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Table View</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchTables}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <TableLegend />
      </div>
      
      <ActionButtons />
      
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="pr-4 pb-4">
          <div
            className="grid gap-2 mt-3"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {tables.map((table: Table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
