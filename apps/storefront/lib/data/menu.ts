import type { GetMenuParams, GetMenuResult, MenuResponse } from './types';
import menuData from '../../public/dummy-menu.json';

/**
 * Get menu data for a specific shop and category
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

  // In Phase 1: Read from JSON file
  // In Phase 2: This will be replaced with API call
  // UI components will NOT need any changes
  const data = menuData as MenuResponse;

  if (data.menu.shopId !== shopId) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  const { menu } = data;

  // Get all active categories sorted by orderIndex
  const sortedCategories = menu.categories
    .filter(cat => cat.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);

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
