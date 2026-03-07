"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface DashboardContextType {
  isMenuMode: boolean;
  setIsMenuMode: (value: boolean) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (value: boolean) => void;
  isAddItemOpen: boolean;
  setIsAddItemOpen: (value: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isMenuMode, setIsMenuMode] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  return (
    <DashboardContext.Provider
      value={{
        isMenuMode,
        setIsMenuMode,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        isAddItemOpen,
        setIsAddItemOpen,
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
