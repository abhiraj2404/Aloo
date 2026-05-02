import { ShopService } from "@repo/api-sdk";
import { MenuPage } from "@/components/menu";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";

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
  const theme = (shop as any).storefrontTheme || "classic";

  return (
    <ThemeProvider theme={theme}>
      <CartProvider>
        <MenuPage
          shopId={shopId}
          shopName={shop.name}
          shopAddress={shop.address}
          categories={categories}
          theme={theme}
        />
      </CartProvider>
    </ThemeProvider>
  );
}
