"use client";

import { LogOut, UtensilsCrossed } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Switch } from "@repo/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Logo } from "@/components/shared";
import { useDashboard } from "@/lib/dashboard-context";

export function Sidebar() {
  const { isMenuMode, setIsMenuMode } = useDashboard();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 flex flex-col bg-white border-r shadow-sm">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b px-2">
        <Logo className="text-red-500 w-10 h-10" />
      </div>

      {/* Menu Toggle */}
      <div className="flex flex-col items-center py-3 border-b">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-1">
              <UtensilsCrossed className={cn("h-5 w-5", isMenuMode ? "text-red-500" : "text-gray-600")} />
              <Switch 
                className="scale-75" 
                checked={isMenuMode}
                onCheckedChange={setIsMenuMode}
              />
              <span className={cn("text-[10px]", isMenuMode ? "text-red-500 font-medium" : "text-gray-500")}>Menu</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{isMenuMode ? "Switch to Tables" : "Switch to Menu"}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* User */}
      <div className="p-2 flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-red-100 text-red-500 text-sm">
                JD
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">Jhunjhunu wala</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
