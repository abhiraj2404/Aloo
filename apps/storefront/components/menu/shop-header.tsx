"use client";

import { Badge } from "@repo/ui/components/badge";
import { Separator } from "@repo/ui/components/separator";
import type { Shop } from "@repo/types";

interface ShopHeaderProps extends Pick<Shop, "name" | "address"> {
  tableNum: string | null;
}

export const ShopHeader = ({ name, address, tableNum }: ShopHeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-1 text-gray-900">{name}</h1>
        <p className="text-sm text-gray-500">{address}</p>
        {tableNum && (
          <Badge
            variant="outline"
            className="mt-3 border-green-200 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5"
          >
            Table {tableNum}
          </Badge>
        )}
      </div>
      <Separator />
    </header>
  );
};
