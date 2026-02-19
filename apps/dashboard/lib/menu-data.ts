export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  orderIndex: number;
  items: MenuItem[];
}

export const dummyMenuCategories: MenuCategory[] = [
  {
    id: "cat_starters",
    name: "Starters",
    orderIndex: 1,
    items: [
      { id: "item_1", name: "Paneer Tikka", price: 22000, isVeg: true, isAvailable: true, categoryId: "cat_starters" },
      { id: "item_2", name: "Chicken Tikka", price: 28000, isVeg: false, isAvailable: true, categoryId: "cat_starters" },
      { id: "item_3", name: "Veg Spring Roll", price: 18000, isVeg: true, isAvailable: false, categoryId: "cat_starters" },
      { id: "item_4", name: "Fish Finger", price: 32000, isVeg: false, isAvailable: true, categoryId: "cat_starters" },
      { id: "item_5", name: "Aloo Tikki", price: 12000, isVeg: true, isAvailable: true, categoryId: "cat_starters" },
      { id: "item_6", name: "Hara Bhara Kebab", price: 16000, isVeg: true, isAvailable: true, categoryId: "cat_starters" },
    ],
  },
  {
    id: "cat_main",
    name: "Main Course",
    orderIndex: 2,
    items: [
      { id: "item_7", name: "Butter Chicken", price: 35000, isVeg: false, isAvailable: true, categoryId: "cat_main" },
      { id: "item_8", name: "Paneer Butter Masala", price: 28000, isVeg: true, isAvailable: true, categoryId: "cat_main" },
      { id: "item_9", name: "Dal Makhani", price: 22000, isVeg: true, isAvailable: true, categoryId: "cat_main" },
      { id: "item_10", name: "Chicken Biryani", price: 32000, isVeg: false, isAvailable: false, categoryId: "cat_main" },
      { id: "item_11", name: "Veg Biryani", price: 24000, isVeg: true, isAvailable: true, categoryId: "cat_main" },
      { id: "item_12", name: "Mutton Rogan Josh", price: 42000, isVeg: false, isAvailable: true, categoryId: "cat_main" },
      { id: "item_13", name: "Kadai Paneer", price: 26000, isVeg: true, isAvailable: true, categoryId: "cat_main" },
      { id: "item_14", name: "Shahi Paneer", price: 28000, isVeg: true, isAvailable: false, categoryId: "cat_main" },
    ],
  },
  {
    id: "cat_bread",
    name: "Breads",
    orderIndex: 3,
    items: [
      { id: "item_15", name: "Butter Naan", price: 6000, isVeg: true, isAvailable: true, categoryId: "cat_bread" },
      { id: "item_16", name: "Garlic Naan", price: 7000, isVeg: true, isAvailable: true, categoryId: "cat_bread" },
      { id: "item_17", name: "Tandoori Roti", price: 4000, isVeg: true, isAvailable: true, categoryId: "cat_bread" },
      { id: "item_18", name: "Laccha Paratha", price: 6000, isVeg: true, isAvailable: true, categoryId: "cat_bread" },
      { id: "item_19", name: "Kulcha", price: 5000, isVeg: true, isAvailable: false, categoryId: "cat_bread" },
    ],
  },
  {
    id: "cat_rice",
    name: "Rice",
    orderIndex: 4,
    items: [
      { id: "item_20", name: "Steamed Rice", price: 12000, isVeg: true, isAvailable: true, categoryId: "cat_rice" },
      { id: "item_21", name: "Jeera Rice", price: 14000, isVeg: true, isAvailable: true, categoryId: "cat_rice" },
      { id: "item_22", name: "Fried Rice", price: 16000, isVeg: true, isAvailable: true, categoryId: "cat_rice" },
    ],
  },
  {
    id: "cat_beverages",
    name: "Beverages",
    orderIndex: 5,
    items: [
      { id: "item_23", name: "Masala Chai", price: 4000, isVeg: true, isAvailable: true, categoryId: "cat_beverages" },
      { id: "item_24", name: "Cold Coffee", price: 12000, isVeg: true, isAvailable: true, categoryId: "cat_beverages" },
      { id: "item_25", name: "Fresh Lime Soda", price: 8000, isVeg: true, isAvailable: true, categoryId: "cat_beverages" },
      { id: "item_26", name: "Mango Lassi", price: 10000, isVeg: true, isAvailable: false, categoryId: "cat_beverages" },
      { id: "item_27", name: "Buttermilk", price: 6000, isVeg: true, isAvailable: true, categoryId: "cat_beverages" },
    ],
  },
  {
    id: "cat_desserts",
    name: "Desserts",
    orderIndex: 6,
    items: [
      { id: "item_28", name: "Gulab Jamun", price: 8000, isVeg: true, isAvailable: true, categoryId: "cat_desserts" },
      { id: "item_29", name: "Rasmalai", price: 10000, isVeg: true, isAvailable: true, categoryId: "cat_desserts" },
      { id: "item_30", name: "Kheer", price: 9000, isVeg: true, isAvailable: true, categoryId: "cat_desserts" },
      { id: "item_31", name: "Ice Cream", price: 12000, isVeg: true, isAvailable: true, categoryId: "cat_desserts" },
    ],
  },
];
