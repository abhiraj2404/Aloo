"use client";

import { LogOut, UtensilsCrossed, FolderPlus, CookingPot, LayoutGrid, ClipboardList, Receipt, Settings, PieChart, ChefHat } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Logo } from "@/components/shared";
import { useDashboard } from "@/lib/dashboard-context";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthService } from "@repo/api-sdk";

export function Sidebar() {
  const { activeMode, setActiveMode, setIsAddCategoryOpen, setIsAddItemOpen, userRole } = useDashboard();
  const router = useRouter();
  const params = useParams() as { id?: string };
  const pathname = usePathname();
  const shopId = params.id;
  const isKitchenRoute = !!shopId && pathname?.startsWith(`/dashboard/${shopId}/kitchen`);

  const handleLogOut = () => {
    AuthService.logout();
    router.push('/auth/signin');
  }

  const allNavItems = [
    { mode: "analytics" as const, icon: PieChart, label: "Analytics", ownerOnly: true },
    { mode: "tables" as const, icon: LayoutGrid, label: "Tables", ownerOnly: false },
    { mode: "menu" as const, icon: UtensilsCrossed, label: "Menu", ownerOnly: false },
    { mode: "orders" as const, icon: ClipboardList, label: "Orders", ownerOnly: false },
    { mode: "bills" as const, icon: Receipt, label: "Bills", ownerOnly: true },
    { mode: "settings" as const, icon: Settings, label: "Settings", ownerOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.ownerOnly || userRole === "OWNER");

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 flex flex-col bg-white border-r shadow-sm">
      <div className="flex h-14 items-center justify-center border-b px-2">
        <Logo className="text-red-500 w-10 h-10" />
      </div>

      <div className="flex flex-col items-center py-2 border-b gap-1">
        {navItems.map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setActiveMode(mode);
                  if (shopId && pathname !== `/dashboard/${shopId}`) {
                    router.push(`/dashboard/${shopId}`);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-12 py-2 rounded-lg transition-colors",
                  activeMode === mode && !isKitchenRoute
                    ? "bg-red-50 text-red-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}

        {shopId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/dashboard/${shopId}/kitchen`}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-12 py-2 rounded-lg transition-colors",
                  isKitchenRoute
                    ? "bg-red-50 text-red-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <ChefHat className="h-5 w-5" />
                <span className="text-[10px] font-medium">Kitchen</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Kitchen Display</TooltipContent>
          </Tooltip>
        )}
      </div>

      {activeMode === "menu" && (
        <div className="flex flex-col items-center py-3 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setIsAddCategoryOpen(true)}>
                <FolderPlus className="h-5 w-5 text-gray-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Add Category</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setIsAddItemOpen(true)}>
                <CookingPot className="h-5 w-5 text-gray-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Add Item</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex-1" />

      <div className="p-2 flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-red-100 text-red-500 text-sm">
                JD
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right">Profile</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
