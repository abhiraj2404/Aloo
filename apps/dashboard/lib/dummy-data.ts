export type TableStatus = "blank" | "running" | "printed" | "paid" | "running_kot";

export interface TableData {
  id: string;
  number: number;
  categoryId: string;
  status: TableStatus;
  hasKOT?: boolean;
  hasPrint?: boolean;
  hasView?: boolean;
}

export interface TableCategory {
  id: string;
  name: string;
}

export const dummyShop = {
  id: "shop_1",
  name: "Aloo Restaurant",
  address: "123 Food Street, Mumbai",
};

export const tableCategories: TableCategory[] = [
  { id: "cat_1", name: "A/C" },
  { id: "cat_2", name: "Non A/C" },
  { id: "cat_3", name: "Bar" },
];

export const tables: TableData[] = [
  // A/C Tables (28)
  { id: "t1", number: 1, categoryId: "cat_1", status: "blank" },
  { id: "t2", number: 2, categoryId: "cat_1", status: "running", hasPrint: true },
  { id: "t3", number: 3, categoryId: "cat_1", status: "blank" },
  { id: "t4", number: 4, categoryId: "cat_1", status: "blank" },
  { id: "t5", number: 5, categoryId: "cat_1", status: "running", hasKOT: true, hasPrint: true },
  { id: "t6", number: 6, categoryId: "cat_1", status: "blank" },
  { id: "t7", number: 7, categoryId: "cat_1", status: "blank" },
  { id: "t8", number: 8, categoryId: "cat_1", status: "printed", hasPrint: true, hasView: true },
  { id: "t9", number: 9, categoryId: "cat_1", status: "running_kot", hasPrint: true, hasView: true },
  { id: "t10", number: 10, categoryId: "cat_1", status: "blank" },
  { id: "t11", number: 11, categoryId: "cat_1", status: "blank" },
  { id: "t12", number: 12, categoryId: "cat_1", status: "running", hasPrint: true },
  { id: "t13", number: 13, categoryId: "cat_1", status: "blank" },
  { id: "t14", number: 14, categoryId: "cat_1", status: "running" },
  { id: "t15", number: 15, categoryId: "cat_1", status: "blank" },
  { id: "t16", number: 16, categoryId: "cat_1", status: "blank" },
  { id: "t17", number: 17, categoryId: "cat_1", status: "blank" },
  { id: "t18", number: 18, categoryId: "cat_1", status: "blank" },
  { id: "t19", number: 19, categoryId: "cat_1", status: "printed", hasPrint: true, hasView: true },
  { id: "t20", number: 20, categoryId: "cat_1", status: "blank" },
  { id: "t21", number: 21, categoryId: "cat_1", status: "blank" },
  { id: "t22", number: 22, categoryId: "cat_1", status: "blank" },
  { id: "t23", number: 23, categoryId: "cat_1", status: "blank" },
  { id: "t24", number: 24, categoryId: "cat_1", status: "blank" },
  { id: "t25", number: 25, categoryId: "cat_1", status: "blank" },
  { id: "t26", number: 26, categoryId: "cat_1", status: "running_kot", hasKOT: true },
  { id: "t27", number: 27, categoryId: "cat_1", status: "paid", hasPrint: true, hasView: true },
  { id: "t28", number: 28, categoryId: "cat_1", status: "paid", hasPrint: true, hasView: true },
  // Non A/C Tables (9)
  { id: "t29", number: 1, categoryId: "cat_2", status: "blank" },
  { id: "t30", number: 2, categoryId: "cat_2", status: "running", hasPrint: true, hasView: true },
  { id: "t31", number: 3, categoryId: "cat_2", status: "blank" },
  { id: "t32", number: 4, categoryId: "cat_2", status: "blank" },
  { id: "t33", number: 5, categoryId: "cat_2", status: "paid", hasPrint: true, hasView: true },
  { id: "t34", number: 6, categoryId: "cat_2", status: "running" },
  { id: "t35", number: 7, categoryId: "cat_2", status: "blank" },
  { id: "t36", number: 8, categoryId: "cat_2", status: "printed", hasPrint: true, hasView: true },
  { id: "t37", number: 9, categoryId: "cat_2", status: "blank" },
  // Bar Tables (6)
  { id: "t38", number: 1, categoryId: "cat_3", status: "blank" },
  { id: "t39", number: 2, categoryId: "cat_3", status: "running" },
  { id: "t40", number: 3, categoryId: "cat_3", status: "running_kot", hasKOT: true },
  { id: "t41", number: 4, categoryId: "cat_3", status: "blank" },
  { id: "t42", number: 5, categoryId: "cat_3", status: "paid", hasPrint: true },
  { id: "t43", number: 6, categoryId: "cat_3", status: "blank" },
];

export const statusColors: Record<TableStatus, string> = {
  blank: "bg-white border-2 border-gray-200",
  running: "bg-blue-100 border-2 border-blue-200",
  printed: "bg-green-100 border-2 border-green-200",
  paid: "bg-orange-100 border-2 border-orange-200",
  running_kot: "bg-yellow-100 border-2 border-yellow-200",
};

export const legendItems = [
  { status: "blank" as TableStatus, label: "Blank Table", color: "bg-white border border-gray-300" },
  { status: "running" as TableStatus, label: "Running Table", color: "bg-blue-200" },
  { status: "printed" as TableStatus, label: "Printed Table", color: "bg-green-200" },
  { status: "paid" as TableStatus, label: "Paid Table", color: "bg-orange-200" },
  { status: "running_kot" as TableStatus, label: "Running KOT Table", color: "bg-yellow-200" },
];
