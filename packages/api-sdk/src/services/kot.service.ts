import { apiClient } from "../client";

export type KotItem = {
    orderItemId: string;
    name: string;
    variantName: string | null;
    addons: { name: string; price: number }[];
    quantity: number;
};

export type KotOrderItemLive = {
    id: string;
    status: "PENDING" | "READY" | "SERVED" | "HOLD" | "VOID";
};

export type KotDTO = {
    id: string;
    shopId: string;
    orderId: string;
    kotNumber: number;
    dailyKey: string;
    isSupplementary: boolean;
    items: KotItem[];
    printedAt: string | null;
    printCount: number;
    createdAt: string;
    order?: {
        id: string;
        status: string;
        orderType: string;
        tableSession?: {
            table: { tableNumber: number } | null;
        } | null;
        orderItems?: KotOrderItemLive[];
    };
    shop?: { name: string };
};

export const KotService = {
    listActive: async (): Promise<KotDTO[]> => {
        const res = await apiClient.get("/kot");
        return res?.data?.data?.kots ?? [];
    },
    getById: async (id: string): Promise<KotDTO> => {
        const res = await apiClient.get(`/kot/${id}`);
        return res?.data?.data?.kot;
    },
    markPrinted: async (id: string) => {
        const res = await apiClient.post(`/kot/${id}/print`);
        return res?.data?.data?.kot;
    },
};
