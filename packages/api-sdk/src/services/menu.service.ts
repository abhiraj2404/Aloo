import { apiClient } from "../client";
import { type Menu ,type CreateItemInput} from "@repo/types";

export const MenuService = {
  getMenuByShopId: async (shopId: string): Promise<Menu> => {
    const response = await apiClient.get(`/menu/${shopId}`);
    const menu = await response.data.data.menu;

    return menu;
  },

  addCategory: async (name:string) =>{
    const res = await apiClient.post(`/category`,{name});
    return res?.data?.data;
  },
  getCategories: async()=>{
      const res= await apiClient.get('/category');
      return res?.data;
  },
  addItem: async(itemData: CreateItemInput)=>{
    const res = await apiClient.post(`/item`,itemData);
    return res?.data?.data;
  }

  // some other routes if any
};
