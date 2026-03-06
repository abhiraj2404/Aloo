"use client";

import { TableView } from "@/components/dashboard";
import { MenuView } from "@/components/menu";
import { useDashboard } from "@/lib/dashboard-context";

export default function DashboardPage() {
  const { isMenuMode } = useDashboard();
  
  return isMenuMode ? <MenuView /> : <TableView />;
}
