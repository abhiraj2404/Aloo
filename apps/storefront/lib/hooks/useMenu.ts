'use client';

import { useEffect, useState } from 'react';
import { menuService } from '../api';
import { Menu } from '../data/types';
import { ApiError } from '../api/types';

/**
 * Custom hook for fetching menu data on client-side
 * 
 * Features:
 * - Loading state
 * - Error handling
 * - Manual refetch
 * - Simple caching (can be replaced with react-query/SWR later)
 * 
 * @param shopId - The shop ID
 * @returns Menu data, loading state, error, and refetch function
 * 
 * @example
 * function MenuComponent({ shopId }: { shopId: string }) {
 *   const { menu, loading, error, refetch } = useMenu(shopId);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!menu) return null;
 * 
 *   return <div>{menu.shop.name}</div>;
 * }
 */
export function useMenu(shopId: string) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.getMenuByShop(shopId);
      setMenu(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchMenu();
    }
  }, [shopId]);

  return {
    menu,
    loading,
    error,
    refetch: fetchMenu,
  };
}

/**
 * Alternative: Using React Query for better caching and state management
 **/
