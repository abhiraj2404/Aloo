"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Users } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { TableQrModal } from "./table-qr-modal";
import { type Table } from "@repo/types";
import { statusColors, type TableStatus } from "@/lib/dummy-data";

type SessionSummary = {
  id: string;
  pax: number | null;
  customer: { id: string; phone: string; name: string | null } | null;
};

type TableWithSession = Table & {
  status?: TableStatus;
  sessions?: SessionSummary[];
};

export function TableCard({ table, shopId, isOccupied = false, onMutated }: { table: Table; shopId: string; isOccupied?: boolean; onMutated?: () => void }) {
  const router = useRouter();
  const [showQr, setShowQr] = useState(false);
  const tableData = table as TableWithSession;
  const status: TableStatus = isOccupied ? "running" : (tableData.status ?? "blank");
  const session = tableData.sessions?.[0];
  const pax = session?.pax ?? null;
  const customerName = session?.customer?.name ?? null;

  const openQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQr(true);
  };

  return (
    <>
      <div
        onClick={() => router.push(`/dashboard/${shopId}/pos/${table.id}`)}
        className={cn(
          "relative w-full aspect-square rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center p-1.5",
          statusColors[status],
        )}
      >
        <span className="text-sm font-medium">Table {table.tableNumber}</span>

        {(pax !== null || customerName) && (
          <div className="mt-1 flex flex-col items-center gap-0.5 text-[10px] text-gray-700 text-center">
            {pax !== null && (
              <span className="inline-flex items-center gap-0.5 font-semibold">
                <Users className="h-3 w-3" />
                {pax}
              </span>
            )}
            {customerName && (
              <span className="max-w-full truncate text-gray-600">{customerName}</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={openQr}
          className="absolute top-1 right-1 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Show QR code"
        >
          <QrCode className="h-3.5 w-3.5 text-gray-700" />
        </button>
      </div>
      <TableQrModal
        open={showQr}
        onOpenChange={setShowQr}
        tableId={table.id}
        tableNumber={table.tableNumber}
        shopId={shopId}
        onMutated={onMutated}
      />
    </>
  );
}
