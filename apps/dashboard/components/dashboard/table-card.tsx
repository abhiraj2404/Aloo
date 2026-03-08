"use client";

import { useState } from "react";
import { Printer, Eye } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { TableQrModal } from "./table-qr-modal";
import { type Table } from "@repo/types";
import { statusColors, type TableStatus } from "@/lib/dummy-data";

export function TableCard({ table }: { table: Table }) {
  const [showQr, setShowQr] = useState(false);
  const tableData = table as Table & {
    status?: TableStatus;
    hasPrint?: boolean;
    hasView?: boolean;
  };
  const status: TableStatus = tableData.status ?? "blank";

  return (
    <>
      <div
        onClick={() => setShowQr(true)}
        className={cn(
          "relative w-full aspect-square rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center",
          statusColors[status],
        )}
      >
        <span className="text-sm font-medium">Table {table.tableNumber}</span>
        <div className="absolute bottom-1 right-1 flex gap-1">
          <Printer
            className={cn(
              "h-3.5 w-3.5 text-gray-700",
              tableData.hasPrint ? "opacity-100" : "opacity-30",
            )}
          />
          <Eye
            className={cn(
              "h-3.5 w-3.5 text-gray-700",
              tableData.hasView ? "opacity-100" : "opacity-30",
            )}
          />
        </div>
      </div>
      <TableQrModal
        open={showQr}
        onOpenChange={setShowQr}
        tableNumber={table.tableNumber}
      />
    </>
  );
}
