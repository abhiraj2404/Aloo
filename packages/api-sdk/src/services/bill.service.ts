import { apiClient } from "../client";

export const BillService = {
    generateBill: async (tableSessionId: string) => {
        const res = await apiClient.post(`/bill/generate/${tableSessionId}`);
        return res?.data?.data;
    },
    getBillById: async (billId: string) => {
        const res = await apiClient.get(`/bill/${billId}`);
        return res?.data?.data?.bill;
    },
    getAllBills: async () => {
        const res = await apiClient.get("/bill");
        return res?.data?.data?.bills;
    },
    updateBillStatus: async (billId: string, status: string) => {
        const res = await apiClient.patch(`/bill/${billId}/status`, { status });
        return res?.data?.data?.bill;
    },
};
