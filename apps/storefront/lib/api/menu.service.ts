import apiClient from './apiClient';
import { ApiResponse } from './types';
import { Menu } from '../data/types';

/**
 * Menu Service
 * 
 * Handles all menu-related API calls
 */

export interface GetMenuByShopResponse {
  menu: Menu;
}

class MenuService {
  /**
   * Get complete menu for a shop
   * 
   * @param shopId - The shop ID
   * @returns Complete menu with categories and items
   */
  async getMenuByShop(shopId: string): Promise<Menu> {
    const response = await apiClient.get<ApiResponse<GetMenuByShopResponse>>(
      `/menu/${shopId}`
    );

    if (!response.data.success || !response.data.data?.menu) {
      throw new Error('Invalid menu response format');
    }

    return response.data.data.menu;
  }

  /**
   * Future: Get menu with server-side caching control
   * This would be used with react-query or SWR on client-side
   */
  async getMenuByShopWithCache(shopId: string, cacheTime?: number): Promise<Menu> {
    const response = await apiClient.get<ApiResponse<GetMenuByShopResponse>>(
      `/menu/${shopId}`,
      {
        // Custom cache headers if needed
        headers: cacheTime ? { 'Cache-Control': `max-age=${cacheTime}` } : {},
      }
    );

    if (!response.data.success || !response.data.data?.menu) {
      throw new Error('Invalid menu response format');
    }

    return response.data.data.menu;
  }
}

// Export singleton instance
export const menuService = new MenuService();
