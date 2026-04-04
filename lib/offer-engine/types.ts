// ============================================
// Offer Engine — Core Types
// Pure TypeScript, no DB imports
// ============================================

export type OfferType = "fixed_price" | "percentage" | "flat" | "combo_fixed";
export type ScopeType = "all" | "category" | "collection" | "product_set";

export interface OfferRule {
  price?: number;        // fixed_price, combo_fixed
  pct?: number;          // percentage
  max_discount?: number; // percentage cap
  amount?: number;       // flat
  qty?: number;          // combo_fixed: minimum qty to trigger
}

export interface Offer {
  id: string;
  name: string;
  description: string | null;
  offer_type: OfferType;
  scope_type: ScopeType;
  scope_ref_id: string | null;
  rules: OfferRule;
  applicable_channels: string[];
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  priority: number;
  is_combinable: boolean;
  product_ids?: string[]; // populated when scope_type = 'product_set'
}

export interface CartItem {
  product_id: string;
  variant_id: string;
  title: string;
  category_id: string | null;
  collection_ids: string[];
  sale_price: number;
  mrp: number;
  qty: number;
  primary_image?: string | null;
  size: string;
  color?: string | null;
}

export interface ResolvedItem extends CartItem {
  offer_price: number;        // actual price after offer
  offer_savings: number;      // how much saved vs sale_price
  applied_offer_id: string | null;
  applied_offer_name: string | null;
  offer_label: string | null; // display string like "Any 2 @ ₹999"
  line_total: number;         // offer_price * qty
}

export interface OfferResolutionContext {
  channel: string;    // 'website' | 'whatsapp' | 'direct' | 'meesho' etc.
  menu_id?: string;
  current_datetime?: Date;
}

export interface ResolutionResult {
  items: ResolvedItem[];
  subtotal: number;        // sum of line_total
  total_savings: number;   // sum of offer_savings * qty
  applied_offers: string[]; // offer IDs applied
}
