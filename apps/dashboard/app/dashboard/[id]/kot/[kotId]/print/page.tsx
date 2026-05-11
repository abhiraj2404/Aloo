"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KotService, type KotDTO } from "@repo/api-sdk";
import { KotPrintView } from "@/components/kitchen/kot-print-view";

export default function KotPrintPage() {
    const { kotId } = useParams() as { kotId: string };
    const [kot, setKot] = useState<KotDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!kotId) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await KotService.getById(kotId);
                if (cancelled) return;
                setKot(data);
                // Audit + counter
                KotService.markPrinted(kotId).catch(() => { /* fire-and-forget */ });
                // Fire print after paint
                setTimeout(() => window.print(), 250);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Failed to load KOT");
            }
        })();
        return () => { cancelled = true; };
    }, [kotId]);

    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!kot) return <div className="p-8 text-gray-500">Loading KOT...</div>;

    return <KotPrintView kot={kot} />;
}
