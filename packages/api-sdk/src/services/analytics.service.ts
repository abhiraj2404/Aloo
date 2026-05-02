import { apiClient } from "../client";

export const AnalyticsService = {
    getDashboardAnalytics: async (period: string = "today", customStartDate?: string, customEndDate?: string) => {
        const res = await apiClient.get('/analytics', { params: { period, customStartDate, customEndDate } });
        return res?.data?.data;
    }
};
