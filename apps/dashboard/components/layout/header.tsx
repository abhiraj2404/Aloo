"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button className="bg-red-500 hover:bg-red-600 text-white">
          New Order
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Bill No"
            className="pl-9 w-40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
          Delivery
        </Button>
        <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
          Take Away
        </Button>
      </div>
    </header>
  );
}
