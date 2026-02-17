"use client";

import { Button } from "@repo/ui/components/button";
import { Menu } from "lucide-react";

interface MenuFloatingButtonProps {
  onClick: () => void;
  className?: string;
}

export const MenuFloatingButton = ({
  onClick,
  className = "",
}: MenuFloatingButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="icon-lg"
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full bg-black text-white shadow-2xl hover:bg-gray-900 z-50 ${className}`}
      aria-label="Open menu categories"
    >
      <Menu className="size-8!" />
    </Button>
  );
};
