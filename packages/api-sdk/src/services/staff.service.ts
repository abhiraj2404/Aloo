import { apiClient } from "../client";

export type StaffMember = {
    id: string;
    userId: string;
    shopId: string;
    role: "STAFF" | "OWNER";
    joinedAt: string;
    user: {
        id: string;
        email: string;
        name: string;
        createdAt: string;
    };
};

export const StaffService = {
    getStaff: async (): Promise<StaffMember[]> => {
        const response = await apiClient.get(`/staff`);
        return response.data?.data?.staff ?? [];
    },
    addStaff: async (email: string) => {
        const response = await apiClient.post(`/staff`, { email });
        return response.data;
    },
    removeStaff: async (id: string) => {
        const response = await apiClient.delete(`/staff/${id}`);
        return response.data;
    },
};
