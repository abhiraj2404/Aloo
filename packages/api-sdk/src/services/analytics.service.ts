import { apiClient } from "../client";

export type DayEndSummary = {
    date: string;
    paidRevenue: number;
    paidSubtotal: number;
    paidDiscount: number;
    paidBillCount: number;
    openBillCount: number;
    cancelledBillCount: number;
    totalBillCount: number;
    tipsCollected: number;
    paymentModes: { mode: string; amount: number; count: number }[];
};

export const AnalyticsService = {
    getDashboardAnalytics: async (period: string = "today", customStartDate?: string, customEndDate?: string) => {
        const res = await apiClient.get('/analytics', { params: { period, customStartDate, customEndDate } });
        return res?.data?.data;
    },
    getDayEndSummary: async (date?: string): Promise<DayEndSummary> => {
        const res = await apiClient.get('/analytics/day-end', { params: date ? { date } : undefined });
        return res?.data?.data;
    },
};
