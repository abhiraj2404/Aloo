"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Check, Loader2 } from "lucide-react";
import { ShopService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type ThemeId = "classic" | "midnight" | "sunset" | "ocean";

interface ThemeDef {
    id: ThemeId;
    name: string;
    description: string;
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentLight: string;
    cardBg: string;
    border: string;
    cartBarBg: string;
    cartBarText: string;
}

const THEMES: ThemeDef[] = [
    {
        id: "classic",
        name: "Classic",
        description: "Warm, minimal & clean",
        bg: "#ffffff",
        bgSecondary: "#F1F5F9",
        text: "#33272a",
        textSecondary: "#594a4e",
        accent: "#16a34a",
        accentLight: "#c3f0ca",
        cardBg: "#ffffff",
        border: "#e5e7eb",
        cartBarBg: "#33272a",
        cartBarText: "#ffffff",
    },
    {
        id: "midnight",
        name: "Midnight",
        description: "Dark, modern & sleek",
        bg: "#0f172a",
        bgSecondary: "#1e293b",
        text: "#f1f5f9",
        textSecondary: "#94a3b8",
        accent: "#818cf8",
        accentLight: "#312e81",
        cardBg: "#1e293b",
        border: "#334155",
        cartBarBg: "#818cf8",
        cartBarText: "#ffffff",
    },
    {
        id: "sunset",
        name: "Sunset",
        description: "Warm, vibrant & energetic",
        bg: "#fff7ed",
        bgSecondary: "#fed7aa",
        text: "#431407",
        textSecondary: "#9a3412",
        accent: "#f97316",
        accentLight: "#ffedd5",
        cardBg: "#ffffff",
        border: "#fdba74",
        cartBarBg: "#ea580c",
        cartBarText: "#ffffff",
    },
    {
        id: "ocean",
        name: "Ocean",
        description: "Cool, calm & refreshing",
        bg: "#f0f9ff",
        bgSecondary: "#e0f2fe",
        text: "#0c4a6e",
        textSecondary: "#0369a1",
        accent: "#0891b2",
        accentLight: "#cffafe",
        cardBg: "#ffffff",
        border: "#7dd3fc",
        cartBarBg: "#0e7490",
        cartBarText: "#ffffff",
    },
];

function ThemePreview({ theme, isActive }: { theme: ThemeDef; isActive: boolean }) {
    return (
        <div
            className="rounded-lg overflow-hidden border-2 transition-all duration-200"
            style={{
                borderColor: isActive ? theme.accent : theme.border,
                boxShadow: isActive ? `0 0 0 2px ${theme.accent}40` : "none",
            }}
        >
            {/* Mini header */}
            <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.border}` }}
            >
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <div className="h-2 w-12 rounded" style={{ backgroundColor: theme.text, opacity: 0.7 }} />
                </div>
                <div className="h-2 w-8 rounded" style={{ backgroundColor: theme.accentLight }} />
            </div>

            {/* Mini search bar */}
            <div className="px-3 py-1.5" style={{ backgroundColor: theme.bg }}>
                <div className="h-4 rounded-md" style={{ backgroundColor: theme.bgSecondary }} />
            </div>

            {/* Mini category pills */}
            <div className="px-3 py-1 flex gap-1" style={{ backgroundColor: theme.bg }}>
                <div className="h-3 w-10 rounded-full" style={{ backgroundColor: theme.accentLight }} />
                <div className="h-3 w-8 rounded-full" style={{ backgroundColor: theme.bgSecondary }} />
                <div className="h-3 w-12 rounded-full" style={{ backgroundColor: theme.bgSecondary }} />
            </div>

            {/* Mini item cards */}
            <div className="px-3 py-2 grid grid-cols-2 gap-1.5" style={{ backgroundColor: theme.bg }}>
                {[0, 1].map((i) => (
                    <div key={i} className="rounded-md p-1.5" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                        <div className="aspect-[4/3] rounded mb-1" style={{ backgroundColor: theme.bgSecondary }} />
                        <div className="h-1.5 w-10 rounded mb-0.5" style={{ backgroundColor: theme.text, opacity: 0.5 }} />
                        <div className="flex items-center justify-between">
                            <div className="h-1.5 w-5 rounded" style={{ backgroundColor: theme.text, opacity: 0.4 }} />
                            <div className="h-3 w-6 rounded text-[5px] font-bold flex items-center justify-center"
                                style={{ border: `1px solid ${theme.accent}`, color: theme.accent }}
                            >
                                ADD
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mini cart bar */}
            <div className="px-3 py-1.5 flex items-center justify-center gap-1"
                style={{ backgroundColor: theme.cartBarBg }}
            >
                <div className="h-1.5 w-10 rounded" style={{ backgroundColor: theme.cartBarText, opacity: 0.8 }} />
            </div>
        </div>
    );
}

interface ThemePickerProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export function ThemePicker({ currentTheme, onThemeChange }: ThemePickerProps) {
    const [saving, setSaving] = useState<string | null>(null);
    const { success, error } = useToast();

    const handleSelect = async (themeId: string) => {
        if (themeId === currentTheme) return;
        setSaving(themeId);
        try {
            await ShopService.updateShop({ storefrontTheme: themeId as ThemeId });
            onThemeChange(themeId);
            success(`Theme changed to ${THEMES.find((t) => t.id === themeId)?.name}`);
        } catch (err: any) {
            error(err?.response?.data?.message || "Failed to update theme");
        } finally {
            setSaving(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Storefront Theme</CardTitle>
                <CardDescription>Choose how your customer-facing storefront looks</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {THEMES.map((theme) => {
                        const isActive = theme.id === currentTheme;
                        const isSaving = saving === theme.id;

                        return (
                            <button
                                key={theme.id}
                                onClick={() => handleSelect(theme.id)}
                                disabled={saving !== null}
                                className="text-left space-y-2 group"
                            >
                                <div className="relative">
                                    <ThemePreview theme={theme} isActive={isActive} />
                                    {isActive && (
                                        <div
                                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: theme.accent }}
                                        >
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                    {isSaving && (
                                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{theme.name}</p>
                                    <p className="text-xs text-gray-500">{theme.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
