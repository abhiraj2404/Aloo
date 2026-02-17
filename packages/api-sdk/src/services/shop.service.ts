import { apiClient } from "../client"
import {type Shop} from "@repo/types";

export const ShopService = {
    getById: async(shopId: string): Promise<Shop>  => {
        const response = await apiClient.get(`/shop/${shopId}`);
        const shop = response.data.data;
        return shop;
    },
    getAll: async(): Promise<Shop[]>  => {
        const response = await apiClient.get(`/shop`);
        const shops = response.data.data;
        return shops;
    }
}