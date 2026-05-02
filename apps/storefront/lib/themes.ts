export type ThemeId = "classic" | "midnight" | "sunset" | "ocean";

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    description: string;
    vars: Record<string, string>;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
    classic: {
        id: "classic",
        name: "Classic",
        description: "Warm, minimal & clean",
        vars: {
            "--sf-bg": "#ffffff",
            "--sf-bg-secondary": "#F1F5F9",
            "--sf-text": "#33272a",
            "--sf-text-secondary": "#594a4e",
            "--sf-accent": "#16a34a",
            "--sf-accent-hover": "#15803d",
            "--sf-accent-light": "#c3f0ca",
            "--sf-accent-light-hover": "#a8e6b0",
            "--sf-card-bg": "#ffffff",
            "--sf-border": "#e5e7eb",
            "--sf-header-bg": "#ffffff",
            "--sf-cart-bar-bg": "#33272a",
            "--sf-cart-bar-text": "#ffffff",
        },
    },
    midnight: {
        id: "midnight",
        name: "Midnight",
        description: "Dark, modern & sleek",
        vars: {
            "--sf-bg": "#0f172a",
            "--sf-bg-secondary": "#1e293b",
            "--sf-text": "#f1f5f9",
            "--sf-text-secondary": "#94a3b8",
            "--sf-accent": "#818cf8",
            "--sf-accent-hover": "#6366f1",
            "--sf-accent-light": "#312e81",
            "--sf-accent-light-hover": "#3730a3",
            "--sf-card-bg": "#1e293b",
            "--sf-border": "#334155",
            "--sf-header-bg": "#0f172a",
            "--sf-cart-bar-bg": "#818cf8",
            "--sf-cart-bar-text": "#ffffff",
        },
    },
    sunset: {
        id: "sunset",
        name: "Sunset",
        description: "Warm, vibrant & energetic",
        vars: {
            "--sf-bg": "#fff7ed",
            "--sf-bg-secondary": "#fed7aa",
            "--sf-text": "#431407",
            "--sf-text-secondary": "#9a3412",
            "--sf-accent": "#f97316",
            "--sf-accent-hover": "#ea580c",
            "--sf-accent-light": "#ffedd5",
            "--sf-accent-light-hover": "#fed7aa",
            "--sf-card-bg": "#ffffff",
            "--sf-border": "#fdba74",
            "--sf-header-bg": "#fff7ed",
            "--sf-cart-bar-bg": "#ea580c",
            "--sf-cart-bar-text": "#ffffff",
        },
    },
    ocean: {
        id: "ocean",
        name: "Ocean",
        description: "Cool, calm & refreshing",
        vars: {
            "--sf-bg": "#f0f9ff",
            "--sf-bg-secondary": "#e0f2fe",
            "--sf-text": "#0c4a6e",
            "--sf-text-secondary": "#0369a1",
            "--sf-accent": "#0891b2",
            "--sf-accent-hover": "#0e7490",
            "--sf-accent-light": "#cffafe",
            "--sf-accent-light-hover": "#a5f3fc",
            "--sf-card-bg": "#ffffff",
            "--sf-border": "#7dd3fc",
            "--sf-header-bg": "#f0f9ff",
            "--sf-cart-bar-bg": "#0e7490",
            "--sf-cart-bar-text": "#ffffff",
        },
    },
};

export function getThemeVars(themeId: string): Record<string, string> {
    const theme = THEMES[themeId as ThemeId];
    return theme?.vars ?? THEMES.classic.vars;
}
