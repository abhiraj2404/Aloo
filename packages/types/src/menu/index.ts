import z from "zod";

// ── Variants ──────────────────────────────────────────────────────────────
// Mutually-exclusive sizing/option (Half / Full, Small / Medium / Large).
// price is absolute paise — replaces Item.price for the selected variant.
export const ItemVariantSchema = z.object({
  id: z.cuid(),
  itemId: z.cuid(),
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
  sortOrder: z.number().int().default(0),
});
export type ItemVariant = z.infer<typeof ItemVariantSchema>;

export const CreateVariantInputSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
  sortOrder: z.number().int().optional(),
});
export type CreateVariantInput = z.infer<typeof CreateVariantInputSchema>;

// ── Addons ────────────────────────────────────────────────────────────────
export const AddonSchema = z.object({
  id: z.cuid(),
  addonGroupId: z.cuid(),
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
  sortOrder: z.number().int().default(0),
});
export type Addon = z.infer<typeof AddonSchema>;

export const CreateAddonInputSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().int().min(0),
  sortOrder: z.number().int().optional(),
});
export type CreateAddonInput = z.infer<typeof CreateAddonInputSchema>;

export const AddonGroupSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  name: z.string().min(1).max(80),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
  addons: z.array(AddonSchema).optional(),
});
export type AddonGroup = z.infer<typeof AddonGroupSchema>;

export const CreateAddonGroupInputSchema = z
  .object({
    name: z.string().min(1).max(80),
    minSelect: z.number().int().min(0).default(0),
    maxSelect: z.number().int().min(1).default(1),
    addons: z.array(CreateAddonInputSchema).min(1, "Group must have at least one addon"),
  })
  .refine((d) => d.maxSelect >= d.minSelect, {
    message: "maxSelect must be ≥ minSelect",
    path: ["maxSelect"],
  });
export type CreateAddonGroupInput = z.infer<typeof CreateAddonGroupInputSchema>;

export const UpdateAddonGroupInputSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    minSelect: z.number().int().min(0).optional(),
    maxSelect: z.number().int().min(1).optional(),
    // Full replacement of addons; client sends the desired final list.
    // Each item with id is preserved (or updated), without id is created, missing ones are deleted.
    addons: z
      .array(
        z.object({
          id: z.cuid().optional(),
          name: z.string().min(1).max(80),
          price: z.number().int().min(0),
          sortOrder: z.number().int().optional(),
        }),
      )
      .min(1)
      .optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.minSelect !== undefined ||
      d.maxSelect !== undefined ||
      d.addons !== undefined,
    { message: "At least one field is required" },
  );
export type UpdateAddonGroupInput = z.infer<typeof UpdateAddonGroupInputSchema>;

// ── Item ──────────────────────────────────────────────────────────────────
export const ItemSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  categoryId: z.cuid(),
  name: z.string().min(1, "Name is required"),
  price: z.number().int().min(0, "Price cannot be negative"),
  isVeg: z.boolean(),
  image: z.url().optional(),
  isAvailable: z.boolean().optional(),
  variants: z.array(ItemVariantSchema).optional(),
  addonGroups: z.array(AddonGroupSchema).optional(),
});

export const CategorySchema = z.object({
  id: z.cuid(),
  menuId: z.cuid(),
  name: z.string().min(1, "Category name is required"),
  orderIndex: z.number(),
  items: z.array(ItemSchema).optional(),
  isActive: z.boolean().optional(),
});

export const MenuSchema = z.object({
  id: z.cuid(),
  shopId: z.cuid(),
  categories: z.array(CategorySchema).optional(),
});

export const CreateItemSchema = ItemSchema.omit({
  id: true,
  shopId: true,
  variants: true,
  addonGroups: true,
});
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

export const CreateCategorySchema = CategorySchema.omit({ id: true, orderIndex: true, items: true });
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const CreateMenuSchema = MenuSchema.omit({ id: true, categories: true });
export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;

export type Item = z.infer<typeof ItemSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Menu = z.infer<typeof MenuSchema>;
