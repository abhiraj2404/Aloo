"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface DashboardContextType {
  isMenuMode: boolean;
  setIsMenuMode: (value: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isMenuMode, setIsMenuMode] = useState(false);

  return (
    <DashboardContext.Provider value={{ isMenuMode, setIsMenuMode }}>
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
