import { z } from "zod";

// ===========================
// Product Validation
// ===========================

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1, "Size is required"),
  color: z.string().nullable().optional(),
  color_hex: z.string().nullable().optional(),
  stock_qty: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  sku_variant: z.string().optional(),
});

export const productImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url("Invalid image URL"),
  alt_text: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_primary: z.boolean().default(false),
});

export const productSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().nullable().optional(),
  highlights: z.array(z.string()).default([]),
  category_id: z.string().uuid("Select a category").nullable().optional(),
  gender: z.enum(["men", "women", "unisex"]),
  mrp: z.coerce.number().positive("MRP must be positive"),
  sale_price: z.coerce.number().positive("Sale price must be positive"),
  sku: z.string().optional(),
  tags: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_draft: z.boolean().default(true),
  material: z.string().nullable().optional(),
  care_instructions: z.string().nullable().optional(),
  collection_ids: z.array(z.string().uuid()).default([]),
  variants: z.array(productVariantSchema).default([]),
  images: z.array(productImageSchema).default([]),
}).refine((data) => data.sale_price <= data.mrp, {
  message: "Sale price must be less than or equal to MRP",
  path: ["sale_price"],
});

export type ProductFormData = z.infer<typeof productSchema>;

// ===========================
// Category Validation
// ===========================

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug format invalid"),
  gender: z.enum(["men", "women", "unisex", "all"]).default("all"),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

// ===========================
// Coupon Validation
// ===========================

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  discount_type: z.enum(["percentage", "flat"]),
  discount_value: z.coerce.number().positive("Discount must be positive"),
  min_order_amount: z.coerce.number().min(0).default(0),
  max_uses: z.coerce.number().int().positive().nullable().optional(),
  valid_from: z.string(),
  valid_until: z.string(),
  is_active: z.boolean().default(true),
  campaign_id: z.string().uuid().nullable().optional(),
});

// ===========================
// Order Status Update
// ===========================

export const orderStatusUpdateSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  note: z.string().optional(),
});
