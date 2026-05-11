import { apiClient } from "../client";
import type { CreateOrder, OrderItemStatus } from "@repo/types";

export const OrderService = {
    createOrder: async (data: CreateOrder) => {
        const res = await apiClient.post("/order", data);
        return res?.data?.data?.order;
    },
    getOrderById: async (orderId: string) => {
        const res = await apiClient.get(`/order/${orderId}`);
        return res?.data?.data?.order;
    },
    getAllOrders: async () => {
        const res = await apiClient.get("/order");
        return res?.data?.data?.orders;
    },
    updateOrderItems: async (orderId: string, items: { itemId: string; quantity: number }[]) => {
        const res = await apiClient.put(`/order/${orderId}/items`, { items });
        return res?.data?.data?.order;
    },
    updateOrderStatus: async (orderId: string, status: string) => {
        const res = await apiClient.patch(`/order/${orderId}/status`, { status });
        return res?.data?.data?.order;
    },
    updateItemStatus: async (orderItemId: string, status: OrderItemStatus) => {
        const res = await apiClient.patch(`/order-item/${orderItemId}/status`, { status });
        return res?.data?.data?.order;
    },
    deleteOrder: async (orderId: string) => {
        const res = await apiClient.delete(`/order/${orderId}`);
        return res?.data;
    },
};