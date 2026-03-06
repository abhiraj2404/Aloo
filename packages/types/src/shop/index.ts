import z from "zod";
import { MenuSchema } from "../menu";

export const TableSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  tableNumber: z.number().int().positive(),
});

export const ShopSchema = z.object({
  id: z.cuid(),
  name: z.string().min(1, "Name is required"),
  address: z.string(),
  totalTable:z.number().optional(),

  tables: z.array(TableSchema).optional(),
  menu: MenuSchema.optional(),
});

export const CreateTableSchema = TableSchema.omit({ id: true });
export type CreateTableInput = z.infer<typeof CreateTableSchema>;

export const CreateShopSchema = ShopSchema.omit({ id: true });
export type CreateShopInput = z.infer<typeof CreateShopSchema>;

export type Table = z.infer<typeof TableSchema>;
export type Shop = z.infer<typeof ShopSchema>;
