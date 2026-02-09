'use client';

import { useEffect, useState } from 'react';
import { shopService } from '../api';
import { Shop } from '../data/types';
import { ApiError } from '../api/types';

/**
 * Custom hook for fetching shop data on client-side
 * 
 * @param shopId - The shop ID
 * @returns Shop data, loading state, error, and refetch function
 */
export function useShop(shopId: string) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const fetchShop = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shopService.getShopById(shopId);
      setShop(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  return {
    shop,
    loading,
    error,
    refetch: fetchShop,
  };
}

/**
 * Hook for fetching all shops
 */
export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shopService.getAllShops();
      setShops(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return {
    shops,
    loading,
    error,
    refetch: fetchShops,
  };
}
