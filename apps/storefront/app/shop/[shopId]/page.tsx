import { ShopService } from "@repo/api-sdk";
import { MenuPage } from "@/components/menu";
import { CartProvider } from "@/lib/cart-context";

interface PageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopPage({ params }: PageProps) {
  const { shopId } = await params;

  const shop = await ShopService.getById(shopId);

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.menu) {
    throw new Error("Menu not found");
  }

  const categories = shop.menu.categories || [];

  return (
    <CartProvider>
      <MenuPage
        shopId={shopId}
        shopName={shop.name}
        shopAddress={shop.address}
        categories={categories}
      />
    </CartProvider>
  );
}
