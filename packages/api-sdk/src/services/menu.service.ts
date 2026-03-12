import { apiClient } from "../client";
import { type Menu ,type CreateItemInput, type UpdateItemInput} from "@repo/types";

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
  },

  updateCategory: async (id: string, name?: string, isActive?: boolean, menuId?: string) => {
    const body: any = { id };
    if (name) body.name = name;
    if (isActive !== undefined) body.isActive = isActive;
    if (menuId) body.menuId = menuId;
    const res = await apiClient.put(`/category`, body);
    return res?.data?.data;
  },

  deleteCategory: async (id: string, menuId: string) => {
    const res = await apiClient.delete(`/category`, { data: { id, menuId } });
    return res?.data?.data;
  },

  toggleCategoryAvailability: async (id: string, menuId: string, isActive: boolean) => {
    return MenuService.updateCategory(id, undefined, isActive, menuId);
  },

  updateItem: async (id: string, shopId: string, updates: UpdateItemInput) => {
    const body = { id, shopId, ...updates };
    const res = await apiClient.put(`/item`, body);
    return res?.data?.data;
  },

  deleteItem: async (id: string, shopId: string) => {
    const res = await apiClient.delete(`/item`, { data: { id, shopId } });
    return res?.data?.data;
  },

  toggleItemAvailability: async (id: string, shopId: string, isAvailable: boolean) => {
    return MenuService.updateItem(id, shopId, { isAvailable });
  }
};
