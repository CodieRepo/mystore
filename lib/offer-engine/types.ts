// ============================================
// Offer Engine — Core Types
// Pure TypeScript, no DB imports
// ============================================

/**
 * Defines the core computational logic applied by an offer.
 * - `fixed_price`: Forces the item's `offer_price` to a specific absolute value.
 * - `percentage`: Reduces the `offer_price` by a matching `%` from its original `sale_price`.
 * - `flat`: Reduces the `offer_price` by a flat currency amount.
 * - `combo_fixed`: Triggers a bundled fixed price ONLY if the `qty` threshold is met across eligible items within scope.
 */
export type OfferType = "fixed_price" | "percentage" | "flat" | "combo_fixed";

/**
 * Defines the boundary of items an offer can inspect/mutate.
 * - `all`: Every item in the cart.
 * - `category`: Only items matching `product.category_id`.
 * - `collection`: Only items possessing the matching collection ID.
 * - `product_set`: Only specific products identified by their IDs (stored in `offer_product_scope`).
 */
export type ScopeType = "all" | "category" | "collection" | "product_set";

/**
 * Computational payload containing variables corresponding to the `OfferType`.
 */
export interface OfferRule {
  /** Target price for `fixed_price` and `combo_fixed` offers */
  price?: number;        
  /** Deduction percentage for `percentage` offers (e.g. 20 for 20%) */
  pct?: number;          
  /** Maximum currency cap on a percentage deduction (e.g. Max Rs 500 off) */
  max_discount?: number; 
  /** Exact currency amount to deduct for `flat` offers */
  amount?: number;       
  /** Minimum quantity required across all in-scope items to trigger a `combo_fixed` offer */
  qty?: number;          
}

/**
 * Represents the database entity determining how an active discount is applied across the cart.
 */
export interface Offer {
  id: string;
  name: string;
  description: string | null;
  offer_type: OfferType;
  scope_type: ScopeType;
  
  /** The UUID of the category or collection if `scope_type` is category/collection */
  scope_ref_id: string | null;
  
  rules: OfferRule;
  
  /** Array of string identifiers representing valid sales channels. If empty, applies universally. */
  applicable_channels: string[];
  
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  
  /** Defines evaluation order. Offers with lower priority numbers run first. */
  priority: number;
  
  /** Currently unused. Will allow overlapping offers (e.g., storewide 10% + free shipping) in standard carts safely. */
  is_combinable: boolean;
  
  /** Dynamically populated during resolution if `scope_type === 'product_set'` */
  product_ids?: string[]; 
}

/**
 * Input format for the Offer Engine representing a cart line-item.
 */
export interface CartItem {
  product_id: string;
  variant_id: string;
  title: string;
  category_id: string | null;
  collection_ids: string[];
  
  /** The standard selling price of the item before offers are applied. Core reference for percentage deductions. */
  sale_price: number;
  
  mrp: number;
  qty: number;
  primary_image?: string | null;
  size: string;
  color?: string | null;
}

/**
 * The output representation of an evaluated cart line-item.
 */
export interface ResolvedItem extends CartItem {
  /** The final computational price per single unit of the item considering all applied offers */
  offer_price: number;        
  
  /** The currency amount saved compared to the baseline `sale_price` per unit */
  offer_savings: number;      
  
  applied_offer_id: string | null;
  applied_offer_name: string | null;
  
  /** Customer-facing string detailing why the price is reduced (e.g., "Combo Deal: 2 for 999") */
  offer_label: string | null; 
  
  /** The final total spanning `offer_price * qty` */
  line_total: number;         
}

/**
 * Environment contexts that filter which active offers enter evaluation.
 */
export interface OfferResolutionContext {
  channel: string;    // 'website' | 'whatsapp' | 'direct' | 'meesho' etc.
  menu_id?: string;
  current_datetime?: Date;
}

/**
 * The complete output payload returning from the offer engine.
 */
export interface ResolutionResult {
  items: ResolvedItem[];
  subtotal: number;        // sum of line_total
  total_savings: number;   // sum of offer_savings * qty
  applied_offers: string[]; // array of unique offer IDs safely applied
}
