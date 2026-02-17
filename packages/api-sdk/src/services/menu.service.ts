import {apiClient} from "../client";

export const MenuService = {
    getMenuByShopId: async(shopId: string) => {
        return apiClient.get(`/menu/${shopId}`);
    }

    // some other routes if any
}

