import apiClient from './apiClient';
import { ApiResponse } from './types';
import { Shop } from '../data/types';

/**
 * Shop Service
 * 
 * Handles all shop-related API calls
 */

export interface GetShopResponse {
  shop: Shop;
}

export interface GetAllShopsResponse {
  shops: Shop[];
}

class ShopService {
  /**
   * Get shop by ID
   * 
   * @param shopId - The shop ID
   * @returns Shop details
   */
  async getShopById(shopId: string): Promise<Shop> {
    const response = await apiClient.get<ApiResponse<GetShopResponse>>(
      `/shops/${shopId}`
    );

    if (!response.data.success || !response.data.data?.shop) {
      throw new Error('Invalid shop response format');
    }

    return response.data.data.shop;
  }

  /**
   * Get all shops
   * 
   * @returns List of all shops
   */
  async getAllShops(): Promise<Shop[]> {
    const response = await apiClient.get<ApiResponse<GetAllShopsResponse>>(
      '/shops'
    );

    if (!response.data.success || !response.data.data?.shops) {
      throw new Error('Invalid shops response format');
    }

    return response.data.data.shops;
  }
}

// Export singleton instance
export const shopService = new ShopService();
