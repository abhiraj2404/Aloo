"use client";

import { useParams } from "next/navigation";
import { KitchenDisplay } from "@/components/kitchen/kitchen-display";

export default function KitchenPage() {
    const { id } = useParams() as { id: string };
    if (!id) return null;
    return <KitchenDisplay shopId={id} />;
}
