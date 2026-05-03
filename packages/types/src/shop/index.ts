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
  gstNumber: z.string().nullable().optional(),
  cgstRate: z.number().int().optional(),
  sgstRate: z.number().int().optional(),
  serviceChargeRate: z.number().int().optional(),
  storefrontTheme: z.string().optional(),

  tables: z.array(TableSchema).optional(),
  menu: MenuSchema.optional(),
});

export const CreateTableSchema = TableSchema.omit({ id: true });
export type CreateTableInput = z.infer<typeof CreateTableSchema>;

export const UpdateTableSchema = z.object({
  tableNumber: z.number().int().positive(),
});
export type UpdateTableInput = z.infer<typeof UpdateTableSchema>;

export const CreateShopSchema = ShopSchema.omit({ id: true });
export type CreateShopInput = z.infer<typeof CreateShopSchema>;

export const UpdateShopSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    gstNumber: z.string().max(20).nullable().optional(),
    cgstRate: z.int().min(0).max(10000).optional(),          // basis points (0-10000 = 0-100%)
    sgstRate: z.int().min(0).max(10000).optional(),
    serviceChargeRate: z.int().min(0).max(10000).optional(),
    storefrontTheme: z.enum(["classic", "midnight", "sunset", "ocean"]).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.address !== undefined ||
      d.gstNumber !== undefined ||
      d.cgstRate !== undefined ||
      d.sgstRate !== undefined ||
      d.serviceChargeRate !== undefined ||
      d.storefrontTheme !== undefined,
    { message: "At least one field is required" },
  );
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;

export type Table = z.infer<typeof TableSchema>;
export type Shop = z.infer<typeof ShopSchema>;
