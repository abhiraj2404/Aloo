import { apiClient } from "../client";
import { type Shop, type CreateShopInput, type UpdateShopInput } from "@repo/types";

export const ShopService = {
  getById: async (shopId: string): Promise<Shop> => {
    const response = await apiClient.get(`/shop/${shopId}`);
    const shop = response.data.data.shop;
    return shop;
  },
  getAll: async (): Promise<Shop[]> => {
    const response = await apiClient.get(`/shop`);
    const shops = response.data.data.shops;
    return shops;
  },
  createShop: async (data: CreateShopInput) => {
    const response = await apiClient.post(`/shop`, data);
    const shop = response.data.data.shop;
    return shop;
  },
  getMyShop: async (): Promise<Shop> => {
    const response = await apiClient.get(`/shop/me`);
    return response.data.data.shop;
  },
  updateShop: async (data: UpdateShopInput): Promise<Shop> => {
    const response = await apiClient.put(`/shop`, data);
    return response.data.data.shop;
  },
};
