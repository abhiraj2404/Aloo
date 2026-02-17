import {apiClient} from "../client";
import {type Menu} from "@repo/types";
 
export const MenuService = {
    getMenuByShopId: async(shopId: string): Promise<Menu> => {
        const response = await apiClient.get(`/menu/${shopId}`);
        const menu = await response.data.data;

        return menu;
    }

    // some other routes if any
}

