import { apiClient } from "../client";

export type ReceiptDTO = {
    billId: string;
    billNumber: string;
    shopName: string;
    shopAddress: string;
    gstNumber: string | null;
    tableName: string | null;
    createdAt: string;
    customer: { name: string | null; phone: string } | null;
    items: {
        name: string;
        variantName: string | null;
        addons: { name: string; price: number }[];
        quantity: number;
        price: number;
        total: number;
    }[];
    subtotal: number;
    discountType: string | null;
    discountValue: number;
    discountAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    roundOff: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    payments: {
        mode: string;
        amount: number;
        reference: string | null;
        createdAt: string;
    }[];
    status: string;
};

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
    applyDiscount: async (billId: string, body: { type: "PERCENT" | "FLAT"; value: number }) => {
        const res = await apiClient.patch(`/bill/${billId}/discount`, body);
        return res?.data?.data?.bill;
    },
    clearDiscount: async (billId: string) => {
        const res = await apiClient.patch(`/bill/${billId}/discount`, {});
        return res?.data?.data?.bill;
    },
    recordPayment: async (billId: string, body: { mode: string; amount: number; reference?: string; notes?: string }) => {
        const res = await apiClient.post(`/bill/${billId}/payment`, body);
        return res?.data?.data?.bill;
    },
    cancelBill: async (billId: string, reason: string) => {
        const res = await apiClient.patch(`/bill/${billId}/cancel`, { reason });
        return res?.data?.data?.bill;
    },
    getAudit: async (billId: string) => {
        const res = await apiClient.get(`/bill/${billId}/audit`);
        return res?.data?.data?.audit;
    },
    getReceipt: async (billId: string): Promise<ReceiptDTO> => {
        const res = await apiClient.get(`/bill/${billId}/receipt`);
        return res?.data?.data?.receipt;
    },
    getPublicReceipt: async (billId: string): Promise<ReceiptDTO> => {
        const res = await apiClient.get(`/bill/${billId}/public`);
        return res?.data?.data?.receipt;
    },
    sendWhatsApp: async (billId: string): Promise<{ url: string; phone: string; message: string; publicBillUrl: string }> => {
        const res = await apiClient.post(`/bill/${billId}/whatsapp`);
        return res?.data?.data;
    },
};
