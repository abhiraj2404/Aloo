"use client";

import { useState } from "react";
import { Printer, Eye } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { statusColors, type TableData } from "@/lib/dummy-data";
import { TableQrModal } from "./table-qr-modal";

interface TableCardProps {
  table: TableData;
  categoryName?: string;
}

export function TableCard({ table, categoryName }: TableCardProps) {
  const [showQr, setShowQr] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowQr(true)}
        className={cn(
          "relative h-20 w-20 rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center",
          statusColors[table.status]
        )}
      >
        <span className="text-sm font-medium">Table {table.number}</span>
        
        {/* Status icons */}
        {(table.hasPrint || table.hasView) && (
          <div className="absolute bottom-1 right-1 flex gap-1">
            {table.hasPrint && (
              <Printer className="h-3.5 w-3.5 text-gray-500" />
            )}
            {table.hasView && (
              <Eye className="h-3.5 w-3.5 text-gray-500" />
            )}
          </div>
        )}
      </div>
      <TableQrModal
        open={showQr}
        onOpenChange={setShowQr}
        tableNumber={table.number}
        categoryName={categoryName}
      />
    </>
  );
}
