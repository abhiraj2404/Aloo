import { apiClient } from "../client";

export type CustomerSummary = {
    id: string;
    phone: string;
    name: string | null;
    visits: number;
    totalSpent: number;
};

export const CustomerService = {
    search: async (q: string, limit?: number): Promise<CustomerSummary[]> => {
        const res = await apiClient.get("/customer/search", { params: { q, limit } });
        return res?.data?.data?.customers ?? [];
    },
    upsert: async (body: { phone: string; name?: string }): Promise<CustomerSummary> => {
        const res = await apiClient.post("/customer/upsert", body);
        return res?.data?.data?.customer;
    },
};
