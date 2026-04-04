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

export type CategoryFormData = z.infer<typeof categorySchema>;

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

// ===========================
// Offer Validation
// ===========================

export const offerRulesSchema = z.object({
  price: z.coerce.number().positive().optional(),
  pct: z.coerce.number().min(1).max(100).optional(),
  max_discount: z.coerce.number().positive().optional(),
  amount: z.coerce.number().positive().optional(),
  qty: z.coerce.number().int().min(2).optional(),
});

export const offerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().nullable().optional(),
  offer_type: z.enum(["fixed_price", "percentage", "flat", "combo_fixed"]),
  scope_type: z.enum(["all", "category", "collection", "product_set"]).default("all"),
  scope_ref_id: z.string().uuid().nullable().optional(),
  rules: offerRulesSchema,
  applicable_channels: z.array(z.string()).default([]),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  priority: z.coerce.number().int().min(1).default(100),
  is_combinable: z.boolean().default(false),
  product_ids: z.array(z.string().uuid()).default([]),
});

export type OfferFormData = z.infer<typeof offerSchema>;

// ===========================
// Collection Validation
// ===========================

export const collectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug format invalid"),
  description: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
  campaign_id: z.string().uuid().nullable().optional(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

// ===========================
// Public Menu Validation
// ===========================

export const menuSectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  subtitle: z.string().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
});

export const menuSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, hyphens"),
  description: z.string().nullable().optional(),
  offer_id: z.string().uuid().nullable().optional(),
  checkout_mode: z.enum(["whatsapp", "direct"]).default("whatsapp"),
  whatsapp_number: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  expires_at: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
});

export type MenuFormData = z.infer<typeof menuSchema>;

// ===========================
// Public Order Creation
// ===========================

export const publicOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  qty: z.coerce.number().int().min(1),
  size: z.string().min(1),
  color: z.string().nullable().optional(),
});

export const publicOrderSchema = z.object({
  menu_slug: z.string().optional(),
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z.string().min(10, "Valid phone number required").max(15),
  customer_email: z.string().email().nullable().optional(),
  payment_method: z.enum(["COD", "UPI", "CARD", "NETBANKING"]).default("COD"),
  shipping_address: z.object({
    line1: z.string().min(5, "Address is required"),
    line2: z.string().nullable().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().length(6, "Pincode must be 6 digits"),
  }),
  items: z.array(publicOrderItemSchema).min(1, "At least one item required"),
  notes: z.string().nullable().optional(),
});

export type PublicOrderData = z.infer<typeof publicOrderSchema>;
