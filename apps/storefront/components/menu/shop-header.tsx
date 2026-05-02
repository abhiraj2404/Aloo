"use client";

import { Button } from "@repo/ui/components/button";
import { Logo } from "./logo";
import type { Shop } from "@repo/types";

interface ShopHeaderProps extends Pick<Shop, "name" | "address"> {
  tableNum: string | null;
}

export const ShopHeader = ({ name, address, tableNum }: ShopHeaderProps) => {
  return (
    <header style={{ backgroundColor: "var(--sf-header-bg)", borderBottom: "1px solid var(--sf-border)" }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Logo style={{ color: "var(--sf-text)" }} />
        <Button
          className="hidden md:flex font-semibold rounded-lg"
          style={{ backgroundColor: "var(--sf-accent-light)", color: "var(--sf-text)" }}
        >
          Group Order
        </Button>
      </div>
    </header>
  );
};
