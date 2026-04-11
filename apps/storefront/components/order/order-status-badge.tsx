"use client";

import type { OrderStatus } from "@repo/types";

const config: Record<string, { label: string; bg: string; text: string }> = {
    PENDING:   { label: "Pending",   bg: "bg-amber-100",  text: "text-amber-700" },
    CONFIRMED: { label: "Confirmed", bg: "bg-blue-100",   text: "text-blue-700" },
    PREPARING: { label: "Preparing", bg: "bg-purple-100", text: "text-purple-700" },
    COMPLETED: { label: "Served",    bg: "bg-green-100",  text: "text-green-700" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-100",    text: "text-red-700" },
};

export const OrderStatusBadge = ({ status }: { status: string }) => {
    const c = config[status] || config.PENDING;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c?.bg} ${c?.text}`}>
            {c?.label}
        </span>
    );
};
