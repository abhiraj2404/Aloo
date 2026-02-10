import type { GetMenuParams, GetMenuResult, Menu } from './types';
import { menuService } from '../api';
import { unstable_cache } from 'next/cache';

/**
 * Get menu data for a specific shop and category
 * 
 * Architecture:
 * - Uses centralized menuService (no direct HTTP calls)
 * - Next.js cache wrapper for server-side caching
 * - All network logic handled in service layer
 * 
 * @param params.shopId - The shop ID
 * @param params.categoryId - Optional category ID. If not provided, returns first category by orderIndex
 * @returns Menu data with shop info, current category items, and all categories list
 * 
 * @example
 * // Get first category
 * const data = await getMenu({ shopId: 'shop_456def' });
 * 
 * // Get specific category
 * const data = await getMenu({ shopId: 'shop_456def', categoryId: 'cat_2' });
 */
export async function getMenu(params: GetMenuParams): Promise<GetMenuResult> {
  const { shopId, categoryId } = params;

  // Use Next.js unstable_cache for server-side caching
  // This provides more control than fetch cache options
  const getCachedMenu = unstable_cache(
    async (id: string) => menuService.getMenuByShop(id),
    [`menu-${shopId}`], // Cache key
    {
      revalidate: 300, // 5 minutes
      tags: [`menu-${shopId}`], // For on-demand revalidation
    }
  );

  // Fetch menu via service layer (centralized API logic)
  const menu: Menu = await getCachedMenu(shopId);

  // Validate shop
  if (menu.shopId !== shopId) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  // Get all active categories (assumed sorted by backend)
  const sortedCategories = menu.categories
    .filter(cat => cat.isActive);

  // Determine which category to show
  let currentCategory;
  if (categoryId) {
    currentCategory = sortedCategories.find(cat => cat.id === categoryId);
    if (!currentCategory) {
      throw new Error(`Category not found: ${categoryId}`);
    }
  } else {
    // No category specified - return first category
    currentCategory = sortedCategories[0];
    if (!currentCategory) {
      throw new Error('No active categories found');
    }
  }

  // Return shop info, current category with items, and category list
  return {
    shop: menu.shop,
    currentCategory: {
      ...currentCategory,
      // Filter only available items for this category
      items: currentCategory.items.filter(item => !item.image || item.isAvailable)
    },
    allCategories: sortedCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      orderIndex: cat.orderIndex
    }))
  };
}
