import { apiClient } from "../client";

export type PosPreviewItem = {
    itemId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
};

export type PosPreviewInput = {
    items: PosPreviewItem[];
    discountType?: "PERCENT" | "FLAT" | null;
    discountValue?: number;
};

export type PosPreviewResult = {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    preRoundTotal: number;
    roundOff: number;
    totalAmount: number;
};

export const PosService = {
    getTablePos: async (tableId: string) => {
        const res = await apiClient.get(`/pos/table/${tableId}`);
        return res?.data?.data;
    },
    preview: async (input: PosPreviewInput): Promise<PosPreviewResult> => {
        const res = await apiClient.post("/pos/preview", input);
        return res?.data?.data?.preview;
    },
    updateSession: async (
        sessionId: string,
        body: {
            pax?: number | null;
            customerId?: string | null;
            customerPhone?: string;
            customerName?: string;
        },
    ) => {
        const res = await apiClient.patch(`/pos/session/${sessionId}`, body);
        return res?.data?.data?.session;
    },
};
