import z from "zod";

export const ItemSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  categoryId: z.cuid(),
  name: z.string().min(1, "Name is required"),
  price: z.number().int().min(0, "Price cannot be negative"),
  isVeg: z.boolean(),
  image: z.url().optional(),
});

export const CategorySchema = z.object({
  id: z.cuid(),
  menuId: z.cuid(),
  name: z.string().min(1, "Category name is required"),
  items: z.array(ItemSchema).optional(),
});

export const MenuSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  categories: z.array(CategorySchema).optional(),
});

export const CreateItemSchema = ItemSchema.omit({ id: true });
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
// everything is optional
export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;


export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  items: true,
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;


export const CreateMenuSchema = MenuSchema.omit({
  id: true,
  categories: true,
});
export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;

export type Item = z.infer<typeof ItemSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Menu = z.infer<typeof MenuSchema>;
