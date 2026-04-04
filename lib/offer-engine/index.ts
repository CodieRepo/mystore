// ============================================
// Offer Engine — Core Resolver
// Pure TypeScript. No DB access. No side effects.
// All data is passed in as parameters.
// ============================================

import type {
  Offer,
  OfferRule,
  CartItem,
  ResolvedItem,
  OfferResolutionContext,
  ResolutionResult,
} from "./types";

// ─── Helpers ──────────────────────────────────

function isOfferValid(offer: Offer, now: Date): boolean {
  if (offer.valid_from && new Date(offer.valid_from) > now) return false;
  if (offer.valid_until && new Date(offer.valid_until) < now) return false;
  return true;
}

function isOfferForChannel(offer: Offer, channel: string): boolean {
  if (!offer.applicable_channels || offer.applicable_channels.length === 0) return true;
  return offer.applicable_channels.includes(channel);
}

function isItemInScope(item: CartItem, offer: Offer): boolean {
  switch (offer.scope_type) {
    case "all":
      return true;
    case "category":
      return item.category_id === offer.scope_ref_id;
    case "collection":
      return item.collection_ids.includes(offer.scope_ref_id ?? "");
    case "product_set":
      return (offer.product_ids ?? []).includes(item.product_id);
    default:
      return false;
  }
}

// ─── Per-item resolvers ────────────────────────

function resolveFixedPrice(item: CartItem, rules: OfferRule, offer: Offer): ResolvedItem {
  const offerPrice = rules.price ?? item.sale_price;
  const savings = Math.max(0, item.sale_price - offerPrice);
  return {
    ...item,
    offer_price: offerPrice,
    offer_savings: savings,
    applied_offer_id: offer.id,
    applied_offer_name: offer.name,
    offer_label: `${offer.name} – ₹${offerPrice} each`,
    line_total: offerPrice * item.qty,
  };
}

function resolvePercentage(item: CartItem, rules: OfferRule, offer: Offer): ResolvedItem {
  const pct = rules.pct ?? 0;
  let discount = (item.sale_price * pct) / 100;
  if (rules.max_discount) discount = Math.min(discount, rules.max_discount);
  const offerPrice = Math.max(0, item.sale_price - discount);
  const savings = item.sale_price - offerPrice;
  return {
    ...item,
    offer_price: offerPrice,
    offer_savings: savings,
    applied_offer_id: offer.id,
    applied_offer_name: offer.name,
    offer_label: `${pct}% off – ${offer.name}`,
    line_total: offerPrice * item.qty,
  };
}

function resolveFlat(item: CartItem, rules: OfferRule, offer: Offer, totalEligibleQty: number): ResolvedItem {
  // Flat discount spread proportionally across qty of eligible items
  const totalDiscount = rules.amount ?? 0;
  const discountPerUnit = totalEligibleQty > 0 ? totalDiscount / totalEligibleQty : 0;
  const offerPrice = Math.max(0, item.sale_price - discountPerUnit);
  const savings = item.sale_price - offerPrice;
  return {
    ...item,
    offer_price: offerPrice,
    offer_savings: savings,
    applied_offer_id: offer.id,
    applied_offer_name: offer.name,
    offer_label: `₹${totalDiscount} off – ${offer.name}`,
    line_total: offerPrice * item.qty,
  };
}

// ─── Combo resolver ────────────────────────────

/**
 * Resolves pricing for `combo_fixed` offers (e.g., Any 2 for ₹999). 
 * This treats the cart globally instead of on a per-item basis.
 * 
 * Behavior:
 * 1. Collects all targeted units and sorts them by default price descending.
 * 2. Groups them into sets equivalent to `rules.qty` (the minimum size).
 * 3. Applies the combo `rules.price` exclusively to units within complete sets.
 * 4. Any "remainder" units that don't fit into a complete combo set retain their original `sale_price`.
 * 
 * @param eligibleItems - The subset of CartItems matched within the scope of the combo offer.
 * @param rules - The computational structure defining the combo (requires `qty` and `price`).
 * @param offer - The overall Offer entity dictating labels and metadata.
 * @param allItems - The entire unfiltered list of CartItems to securely rebuild the cart.
 * @returns An updated array of `ResolvedItem` covering the full cart with combo logic deeply applied.
 */
function resolveComboItems(
  eligibleItems: CartItem[],
  rules: OfferRule,
  offer: Offer,
  allItems: CartItem[],
): ResolvedItem[] {
  const comboQty = rules.qty ?? 2;
  const comboPrice = rules.price ?? 0;
  const pricePerItemInCombo = comboPrice / comboQty;

  // Flatten to individual units sorted by sale_price desc (most expensive in combo first)
  const units: { item: CartItem; unitPrice: number }[] = [];
  for (const item of eligibleItems) {
    for (let i = 0; i < item.qty; i++) {
      units.push({ item, unitPrice: item.sale_price });
    }
  }
  units.sort((a, b) => b.unitPrice - a.unitPrice);

  // Assign combo price to units in groups
  const unitPriceMap = new Map<string, number[]>(); // product_id+variant_id -> [price per unit]
  units.forEach((unit, idx) => {
    const key = `${unit.item.product_id}_${unit.item.variant_id}`;
    if (!unitPriceMap.has(key)) unitPriceMap.set(key, []);
    const inCombo = idx < Math.floor(units.length / comboQty) * comboQty;
    unitPriceMap.get(key)!.push(inCombo ? pricePerItemInCombo : unit.item.sale_price);
  });

  // Build resolved items using the price map
  return allItems.map((item): ResolvedItem => {
    const key = `${item.product_id}_${item.variant_id}`;
    if (!unitPriceMap.has(key)) {
      // Not an eligible item — no offer applies
      return {
        ...item,
        offer_price: item.sale_price,
        offer_savings: 0,
        applied_offer_id: null,
        applied_offer_name: null,
        offer_label: null,
        line_total: item.sale_price * item.qty,
      };
    }
    const prices = unitPriceMap.get(key)!;
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
    const savings = Math.max(0, item.sale_price - avgPrice);
    return {
      ...item,
      offer_price: avgPrice,
      offer_savings: savings,
      applied_offer_id: offer.id,
      applied_offer_name: offer.name,
      offer_label: `Any ${comboQty} @ ₹${comboPrice} – ${offer.name}`,
      line_total: avgPrice * item.qty,
    };
  });
}

// ─── Main resolver ─────────────────────────────

/**
 * The core computational heart of the Snarky Store Offer Engine.
 * Takes a raw cart and array of active offers, outputting the finalized monetary total.
 * 
 * Rules of Engagement (Phase 1):
 * - Evaluates offers sequentially based on `priority` (lower numbers evaluate first).
 * - Only evaluates offers that align with the active Context (time, channel, availability).
 * - Applies standard items natively (fixed, flat, pct).
 * - Diverts exclusively to `resolveComboItems` if a combo applies. Combos inherently break combination loops.
 * - Stops cascading further offers if the successfully applied offer declares `is_combinable: false`.
 * 
 * @param items - A raw incoming array of generic `CartItem` representing the user's cart.
 * @param offers - All potential active offers (can be a subset attached to a specific `public_menu`).
 * @param context - Environmental constraints ensuring expired or incorrect-channel offers are ignored.
 * @returns A computed `ResolutionResult` payload ready for rendering or database insertion.
 */
export function resolveOffers(
  items: CartItem[],
  offers: Offer[],
  context: OfferResolutionContext,
): ResolutionResult {
  const now = context.current_datetime ?? new Date();
  const channel = context.channel;

  // 1. Filter eligible offers
  const eligibleOffers = offers
    .filter((o) => o.is_active && isOfferValid(o, now) && isOfferForChannel(o, channel))
    .sort((a, b) => a.priority - b.priority); // lower priority number = higher priority

  if (eligibleOffers.length === 0) {
    // No offers — return items at sale_price
    const resolved: ResolvedItem[] = items.map((item) => ({
      ...item,
      offer_price: item.sale_price,
      offer_savings: 0,
      applied_offer_id: null,
      applied_offer_name: null,
      offer_label: null,
      line_total: item.sale_price * item.qty,
    }));
    const subtotal = resolved.reduce((s, i) => s + i.line_total, 0);
    return { items: resolved, subtotal, total_savings: 0, applied_offers: [] };
  }

  // 2. Find highest-priority offer and apply
  // For Phase 1: apply one offer (the highest priority eligible one)
  // Items not in scope of that offer fall back to sale_price
  let resolved: ResolvedItem[] = items.map((item) => ({
    ...item,
    offer_price: item.sale_price,
    offer_savings: 0,
    applied_offer_id: null,
    applied_offer_name: null,
    offer_label: null,
    line_total: item.sale_price * item.qty,
  }));

  const appliedOfferIds: string[] = [];

  for (const offer of eligibleOffers) {
    const scopedItems = items.filter((item) => isItemInScope(item, offer));
    if (scopedItems.length === 0) continue;

    if (offer.offer_type === "combo_fixed") {
      // Combo applies across all items — rebuilds all resolved items
      const totalEligibleQty = scopedItems.reduce((s, i) => s + i.qty, 0);
      const comboQty = offer.rules.qty ?? 2;
      if (totalEligibleQty < comboQty) continue; // not enough items for combo
      resolved = resolveComboItems(scopedItems, offer.rules, offer, items);
      appliedOfferIds.push(offer.id);
      break; // combos are exclusive
    }

    // For non-combo offers, apply to each scoped item
    const totalEligibleQty = scopedItems.reduce((s, i) => s + i.qty, 0);
    let hasChange = false;

    resolved = resolved.map((resolvedItem) => {
      if (!isItemInScope(resolvedItem, offer)) return resolvedItem;
      if (resolvedItem.applied_offer_id && !offer.is_combinable) return resolvedItem; // skip if already has non-combinable offer

      let updated: ResolvedItem;
      switch (offer.offer_type) {
        case "fixed_price":
          updated = resolveFixedPrice(resolvedItem, offer.rules, offer);
          break;
        case "percentage":
          updated = resolvePercentage(resolvedItem, offer.rules, offer);
          break;
        case "flat":
          updated = resolveFlat(resolvedItem, offer.rules, offer, totalEligibleQty);
          break;
        default:
          updated = resolvedItem;
      }
      hasChange = true;
      return updated;
    });

    if (hasChange) {
      appliedOfferIds.push(offer.id);
      if (!offer.is_combinable) break; // stop after first non-combinable offer
    }
  }

  const subtotal = resolved.reduce((s, i) => s + i.line_total, 0);
  const totalSavings = resolved.reduce((s, i) => s + i.offer_savings * i.qty, 0);

  return {
    items: resolved,
    subtotal,
    total_savings: totalSavings,
    applied_offers: appliedOfferIds,
  };
}

/**
 * Instantly computes the theoretical discount state of a single unit.
 * Extremely useful for rendering UI store shelves and "Storefront Pages" without requiring a populated local cart.
 * 
 * Uses a dummy `__display__` variant string against the full `resolveOffers` pipeline
 * to guarantee that UI Badges perfectly match eventual Cart Totals.
 * 
 * @param product - A slimmed-down product entity mapping only core attributes (id, categories, prices).
 * @param offers - Potential active offers running on the storefront.
 * @param context - Environmental constraints.
 * @returns The boolean state of savings, including the formatted tag `offer_label` for badge insertion.
 */
export function resolveProductDisplayPrice(
  product: { id: string; category_id: string | null; collection_ids: string[]; sale_price: number; mrp: number },
  offers: Offer[],
  context: OfferResolutionContext,
): { offer_price: number; savings: number; offer_label: string | null; has_offer: boolean } {
  const cartItem: CartItem = {
    product_id: product.id,
    variant_id: "__display__",
    title: "",
    category_id: product.category_id,
    collection_ids: product.collection_ids ?? [],
    sale_price: product.sale_price,
    mrp: product.mrp,
    qty: 1,
    size: "",
  };
  const result = resolveOffers([cartItem], offers, context);
  const resolved = result.items[0];
  return {
    offer_price: resolved.offer_price,
    savings: resolved.offer_savings,
    offer_label: resolved.offer_label,
    has_offer: resolved.applied_offer_id !== null,
  };
}
