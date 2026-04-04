// ===========================
// Database Types
// ===========================

export type AdminRole = "super_admin" | "admin" | "staff";
export type Gender = "men" | "women" | "unisex";
export type DiscountType = "percentage" | "flat";
export type PaymentMethod = "COD" | "UPI" | "CARD" | "NETBANKING";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type CampaignPlatform = "instagram" | "facebook" | "google" | "whatsapp" | "influencer" | "organic" | "other";
export type CampaignStatus = "draft" | "active" | "paused" | "ended";
export type BannerType = "hero" | "promo" | "announcement";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

// ===========================
// Entity Interfaces
// ===========================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  gender: Gender | "all";
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  is_active: boolean;
  campaign_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  highlights: string[];
  category_id: string | null;
  gender: Gender;
  mrp: number;
  sale_price: number;
  discount_pct: number;
  sku: string;
  tags: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  is_draft: boolean;
  material: string | null;
  care_instructions: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  collections?: Collection[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string | null;
  color_hex: string | null;
  stock_qty: number;
  sku_variant: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  created_at: string;
  is_repeat: boolean;
  tags: string[];
  notes: string | null;
}

export interface Address {
  id: string;
  customer_id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface ShippingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  coupon_id: string | null;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  source_channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  campaign_id: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  status_logs?: OrderStatusLog[];
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_title: string;
  product_image: string | null;
  size: string;
  color: string | null;
  qty: number;
  unit_price: number;
  mrp: number;
  subtotal: number;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  admin_id: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  campaign_id: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: CampaignPlatform;
  utm_campaign: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
}

export interface Banner {
  id: string;
  type: BannerType;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  campaign_id: string | null;
  collection_id: string | null;
  is_active: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface StoreSetting {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

// ===========================
// API Response Types
// ===========================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
}

// ===========================
// Dashboard Stats
// ===========================

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
}

// ===========================
// Phase 1 — Offer Engine Types
// ===========================

export type OfferType = "fixed_price" | "percentage" | "flat" | "combo_fixed";
export type ScopeType = "all" | "category" | "collection" | "product_set";

export interface Offer {
  id: string;
  name: string;
  description: string | null;
  offer_type: OfferType;
  scope_type: ScopeType;
  scope_ref_id: string | null;
  rules: Record<string, number>;
  applicable_channels: string[];
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  priority: number;
  is_combinable: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  product_ids?: string[];
}

// ===========================
// Phase 1 — Public Menu Types
// ===========================

export interface PublicMenu {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  offer_id: string | null;
  checkout_mode: "whatsapp" | "direct";
  whatsapp_number: string | null;
  is_active: boolean;
  expires_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  offer?: Offer | null;
  sections?: PublicMenuSection[];
}

export interface PublicMenuSection {
  id: string;
  menu_id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  created_at: string;
  items?: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  section_id: string;
  item_type: "product" | "collection";
  product_id: string | null;
  collection_id: string | null;
  price_override: number | null;
  sort_order: number;
  product?: Product | null;
}

