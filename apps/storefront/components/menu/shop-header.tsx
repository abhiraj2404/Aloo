"use client";

import { Button } from "@repo/ui/components/button";
import { Logo } from "./logo";
import type { Shop } from "@repo/types";

interface ShopHeaderProps extends Pick<Shop, "name" | "address"> {
  tableNum: string | null;
}

export const ShopHeader = ({ name, address, tableNum }: ShopHeaderProps) => {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Logo className="text-[#33272a]" />
        <Button className="hidden md:flex bg-[#c3f0ca] hover:bg-[#c3f0ca]/90 text-[#33272a] font-semibold rounded-lg">
          Group Order
        </Button>
      </div>
    </header>
  );
};
