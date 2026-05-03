"use client";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { TableCard } from "./table-card";
import { TableLegend } from "./table-legend";
import { ActionButtons } from "./action-buttons";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import { TableService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

export function TableView({ id }: { id: string }) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const fetchTables = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const result = await TableService.getAllTables(id);
      setTables(Array.isArray(result) ? result : []);
    } catch (err: any) {
      if (showLoader) {
        const msg = err?.response?.data?.message || "Failed to fetch tables";
        error(msg);
      }
      setTables([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables(true); // Load with spinner initially

    // Polling engine 
    const interval = setInterval(() => {
      fetchTables(false); // Background sync silently
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Table View</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchTables(true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <TableLegend />
      </div>

      <ActionButtons shopId={id} onMutated={() => fetchTables(false)} />

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="pr-4 pb-4">
          {tables.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No tables yet. Click <span className="font-medium">Add Table</span> to create your first one.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 mt-4">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  shopId={id}
                  isOccupied={table.sessions && table.sessions.length > 0}
                  onMutated={() => fetchTables(false)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
