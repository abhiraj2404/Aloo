"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

<<<<<<< Updated upstream
type DashboardMode = "tables" | "menu" | "orders" | "bills" | "settings";
=======
type DashboardMode = "analytics" | "tables" | "menu" | "orders" | "bills";
>>>>>>> Stashed changes

interface DashboardContextType {
  activeMode: DashboardMode;
  setActiveMode: (mode: DashboardMode) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (value: boolean) => void;
  isAddItemOpen: boolean;
  setIsAddItemOpen: (value: boolean) => void;
  isNewOrderOpen: boolean;
  setIsNewOrderOpen: (value: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [activeMode, setActiveMode] = useState<DashboardMode>("analytics");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

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
