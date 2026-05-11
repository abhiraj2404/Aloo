"use client";

import { useParams } from "next/navigation";
import { PosScreen } from "@/components/pos/pos-screen";

export default function PosPage() {
    const params = useParams();
    const shopId = params.id as string;
    const tableId = params.tableId as string;

    if (!shopId || !tableId) return null;

    return <PosScreen shopId={shopId} tableId={tableId} />;
}
