"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalyticsService, type DayEndSummary } from "@repo/api-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { CalendarDays, IndianRupee, Loader2, ReceiptText, RefreshCw } from "lucide-react";

const formatPaise = (paise: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

const todayIso = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

export function DayEndCard() {
    const [date, setDate] = useState<string>(todayIso());
    const [data, setData] = useState<DayEndSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (d: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await AnalyticsService.getDayEndSummary(d);
            setData(result);
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load day-end summary");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(date); }, [date, fetchData]);

    const isToday = date === todayIso();

    return (
        <Card className="border-red-100">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-red-500" />
                    <CardTitle className="text-sm font-semibold">
                        {isToday ? "Today's Summary" : "Day-End Summary"}
                    </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={date}
                        max={todayIso()}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-7 text-xs border rounded-md px-2 bg-white"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchData(date)} disabled={loading}>
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && !data ? (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-600 py-4">{error}</div>
                ) : data ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Stat
                                icon={<IndianRupee className="h-3.5 w-3.5" />}
                                label="Revenue"
                                value={formatPaise(data.paidRevenue)}
                                accent="text-green-600"
                            />
                            <Stat
                                icon={<ReceiptText className="h-3.5 w-3.5" />}
                                label="Paid bills"
                                value={String(data.paidBillCount)}
                                accent="text-gray-900"
                                sub={data.openBillCount > 0 ? `${data.openBillCount} open` : undefined}
                            />
                            <Stat
                                label="Tips"
                                value={formatPaise(data.tipsCollected)}
                                accent="text-amber-600"
                            />
                            <Stat
                                label="Discounts"
                                value={formatPaise(data.paidDiscount)}
                                accent="text-blue-600"
                            />
                        </div>

                        {data.paymentModes.length > 0 && (
                            <div className="border-t pt-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                    Payments by mode
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.paymentModes
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((p) => (
                                        <div key={p.mode} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 text-xs">
                                            <span className="font-semibold text-gray-700">{p.mode}</span>
                                            <span className="tabular-nums text-gray-900">{formatPaise(p.amount)}</span>
                                            <span className="text-[10px] text-gray-400">×{p.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.cancelledBillCount > 0 && (
                            <p className="text-[11px] text-gray-500 italic">
                                {data.cancelledBillCount} bill{data.cancelledBillCount === 1 ? "" : "s"} cancelled today.
                            </p>
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function Stat({
    icon,
    label,
    value,
    accent,
    sub,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    accent?: string;
    sub?: string;
}) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {icon}
                {label}
            </div>
            <div className={`text-lg font-bold tabular-nums ${accent ?? "text-gray-900"}`}>{value}</div>
            {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
        </div>
    );
}
