import { ShopService } from "@repo/api-sdk";

interface PageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopPage({ params }: PageProps) {
  const { shopId } = await params;

  try {
    // Fetch shop data
    const shop = await ShopService.getById(shopId);
    console.log(shop);

    // Safety check
    if (!shop || !shop.menu) {
      console.log("inside error");
      throw new Error("Shopdata is missing menu information");
    }

    return (
      // <MenuClient
      //   shop={shopData.shop}
      //   currentCategory={shopData.menu.currentCategory}
      //   allCategories={shopData.menu.allCategories}
      //   shopId={shopId}
      // />
      <div>Hello world</div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Menu Not Found</h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Unable to load menu"}
          </p>
          <p className="text-sm text-gray-500 mt-2">Shop ID: {shopId}</p>
        </div>
      </div>
    );
  }
}
