"use client";

import { createContext, useContext } from "react";
import { getThemeVars } from "./themes";

const ThemeContext = createContext<Record<string, string>>(getThemeVars("classic"));

export function ThemeProvider({ theme, children }: { theme: string; children: React.ReactNode }) {
    const vars = getThemeVars(theme);
    return (
        <ThemeContext.Provider value={vars}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeVars() {
    return useContext(ThemeContext);
}
