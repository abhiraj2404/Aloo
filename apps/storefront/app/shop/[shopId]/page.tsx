import { ShopService } from "@repo/api-sdk";
import { MenuPage } from "@/components/menu";
import { Card, CardContent } from "@repo/ui/components/card";

interface PageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopPage({ params }: PageProps) {
  const { shopId } = await params;

    const shop = await ShopService.getById(shopId);

    if (!shop?.menu?.categories?.length) {
      throw new Error("Menu not found");
    }

    const categories = shop.menu.categories;

    return (
      <MenuPage
        shopName={shop.name}
        shopAddress={shop.address}
        categories={categories}
      />
    );
}
