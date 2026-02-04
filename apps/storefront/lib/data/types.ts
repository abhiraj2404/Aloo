export interface Shop {
  id: string;
  name: string;
  address: string;
}

export interface Item {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  price: number; // Price in paise (cents)
  isAvailable: boolean;
  isVeg: boolean;
  image: string | null;
}

export interface Category {
  id: string;
  menuId: string;
  name: string;
  orderIndex: number;
  isActive: boolean;
  items: Item[];
}

export interface Menu {
  id: string;
  shopId: string;
  shop: Shop;
  categories: Category[];
}

export interface MenuResponse {
  menu: Menu;
}

export interface GetMenuParams {
  shopId: string;
  categoryId?: string;
}

export interface GetMenuResult {
  shop: Shop;
  currentCategory: Category;
  allCategories: Pick<Category, 'id' | 'name' | 'orderIndex'>[];
}
