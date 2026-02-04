import { getMenu } from '../../../lib/data/menu';
import { MenuClient } from './components/menu-client';

interface PageProps {
  params: Promise<{
    id: string | string[];
  }>;
  searchParams: Promise<{
    table?: string;
    category?: string;
  }>;
}

/**
 * Menu page - Server Component
 * Fetches menu data and passes to client component
 * 
 * URL patterns:
 * - /menu/shop_456def?table=4 → First category
 * - /menu/shop_456def?table=4&category=cat_2 → Specific category
 */
export default async function MenuPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Extract shopId from params
  const shopId = (Array.isArray(resolvedParams.id) 
    ? resolvedParams.id[0] 
    : resolvedParams.id) as string;

  // Extract category from query params
  const categoryId = resolvedSearchParams.category;

  try {
    // Fetch menu data
    const menuData = await getMenu({ shopId, categoryId });

    return (
      <MenuClient
        shop={menuData.shop}
        currentCategory={menuData.currentCategory}
        allCategories={menuData.allCategories}
        shopId={shopId}
      />
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Menu Not Found</h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Unable to load menu'}
          </p>
        </div>
      </div>
    );
  }
}