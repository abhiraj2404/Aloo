"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AuthService } from "@repo/api-sdk";

type DashboardMode = "analytics" | "tables" | "menu" | "orders" | "bills" | "settings";

interface DashboardContextType {
  activeMode: DashboardMode;
  setActiveMode: (mode: DashboardMode) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (value: boolean) => void;
  isAddItemOpen: boolean;
  setIsAddItemOpen: (value: boolean) => void;
  isNewOrderOpen: boolean;
  setIsNewOrderOpen: (value: boolean) => void;
  userRole: string | null;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<DashboardMode>("tables");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  useEffect(() => {
    AuthService.me().then((user: any) => {
      const role = user?.role || null;
      setUserRole(role);
      if (role === "OWNER") {
        setActiveMode("analytics");
      }
    }).catch(() => {});
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activeMode,
        setActiveMode,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        isAddItemOpen,
        setIsAddItemOpen,
        isNewOrderOpen,
        setIsNewOrderOpen,
        userRole,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
