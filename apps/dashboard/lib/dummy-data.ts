export type TableStatus = "blank" | "running" | "printed" | "paid" | "running_kot";

export interface TableData {
  id: string;
  number: number;
  status: TableStatus;
  hasKOT?: boolean;
  hasPrint?: boolean;
  hasView?: boolean;
}

export const dummyShop = {
  id: "shop_1",
  name: "Aloo Restaurant",
  address: "123 Food Street, Mumbai",
};

export const tables: TableData[] = [
  { id: "t1", number: 1, status: "blank" },
  { id: "t2", number: 2, status: "running", hasPrint: true },
  { id: "t3", number: 3, status: "blank" },
  { id: "t4", number: 4, status: "blank" },
  { id: "t5", number: 5, status: "running", hasKOT: true, hasPrint: true },
  { id: "t6", number: 6, status: "blank" },
  { id: "t7", number: 7, status: "blank" },
  { id: "t8", number: 8, status: "printed", hasPrint: true, hasView: true },
  { id: "t9", number: 9, status: "running_kot", hasPrint: true, hasView: true },
  { id: "t10", number: 10, status: "blank" },
  { id: "t11", number: 11, status: "blank" },
  { id: "t12", number: 12, status: "running", hasPrint: true },
  { id: "t13", number: 13, status: "blank" },
  { id: "t14", number: 14, status: "running" },
  { id: "t15", number: 15, status: "blank" },
  { id: "t16", number: 16, status: "blank" },
  { id: "t17", number: 17, status: "blank" },
  { id: "t18", number: 18, status: "blank" },
  { id: "t19", number: 19, status: "printed", hasPrint: true, hasView: true },
  { id: "t20", number: 20, status: "blank" },
  { id: "t21", number: 21, status: "blank" },
  { id: "t22", number: 22, status: "blank" },
  { id: "t23", number: 23, status: "blank" },
  { id: "t24", number: 24, status: "blank" },
  { id: "t25", number: 25, status: "blank" },
  { id: "t26", number: 26, status: "running_kot", hasKOT: true },
  { id: "t27", number: 27, status: "paid", hasPrint: true, hasView: true },
  { id: "t28", number: 28, status: "paid", hasPrint: true, hasView: true },
  { id: "t29", number: 29, status: "blank" },
  { id: "t30", number: 30, status: "running", hasPrint: true, hasView: true },
  { id: "t31", number: 31, status: "blank" },
  { id: "t32", number: 32, status: "blank" },
  { id: "t33", number: 33, status: "paid", hasPrint: true, hasView: true },
  { id: "t34", number: 34, status: "running" },
  { id: "t35", number: 35, status: "blank" },
  { id: "t36", number: 36, status: "printed", hasPrint: true, hasView: true },
  { id: "t37", number: 37, status: "blank" },
  { id: "t38", number: 38, status: "blank" },
  { id: "t39", number: 39, status: "running" },
  { id: "t40", number: 40, status: "running_kot", hasKOT: true },
  { id: "t41", number: 41, status: "blank" },
  { id: "t42", number: 42, status: "paid", hasPrint: true },
  { id: "t43", number: 43, status: "blank" },
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
];
