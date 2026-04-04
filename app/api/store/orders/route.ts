import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicOrderSchema } from "@/lib/validations";
import { resolveOffers } from "@/lib/offer-engine";
import type { CartItem, Offer } from "@/lib/offer-engine/types";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SNK-${timestamp}-${random}`;
}

// POST /api/store/orders — public order creation from storefront
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(); // anon for reads
    const adminClient = createAdminClient(); // service role for writes

    const body = await request.json();
    const parsed = publicOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(", "),
        success: false,
      }, { status: 400 });
    }

    const { menu_slug, customer_name, customer_phone, customer_email, payment_method, shipping_address, items, notes } = parsed.data;

    // 1. Fetch product + variant data for each item (server-side price validation)
    const productIds = [...new Set(items.map(i => i.product_id))];
    const variantIds = [...new Set(items.map(i => i.variant_id))];

    const [{ data: productsData }, { data: variantsData }] = await Promise.all([
      supabase.from("products").select("id, title, sale_price, mrp, category_id, is_active, is_draft, images:product_images(url, is_primary)").in("id", productIds),
      supabase.from("product_variants").select("id, product_id, size, color, stock_qty").in("id", variantIds),
    ]);

    const productsMap = new Map((productsData || []).map(p => [p.id, p]));
    const variantsMap = new Map((variantsData || []).map(v => [v.id, v]));

    // 2. Validate all items are still active
    for (const item of items) {
      const product = productsMap.get(item.product_id);
      if (!product || !product.is_active || product.is_draft) {
        return NextResponse.json({ data: null, error: `Product no longer available`, success: false }, { status: 400 });
      }
    }

    // 3. Load applicable offers if menu_slug provided
    let activeOffer: Offer | null = null;
    let source_menu_id: string | null = null;

    if (menu_slug) {
      const { data: menu } = await supabase
        .from("public_menus")
        .select("id, offer_id, offer:offers(id, name, offer_type, scope_type, scope_ref_id, rules, applicable_channels, valid_from, valid_until, is_active, priority, is_combinable)")
        .eq("slug", menu_slug)
        .eq("is_active", true)
        .single();

      if (menu) {
        source_menu_id = menu.id;
        if (menu.offer && (menu.offer as unknown as Offer).is_active) {
          activeOffer = menu.offer as unknown as Offer;
          if (activeOffer && activeOffer.scope_type === "product_set") {
            const { data: scope } = await supabase.from("offer_product_scope").select("product_id").eq("offer_id", activeOffer.id);
            activeOffer.product_ids = (scope || []).map((s: { product_id: string }) => s.product_id);
          }
        }
      }
    }

    // 4. Build cart items with VALIDATED server-side prices
    const cartItems: CartItem[] = items.map(item => {
      const product = productsMap.get(item.product_id)!;
      const variant = variantsMap.get(item.variant_id)!;
      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: product.title,
        category_id: product.category_id,
        collection_ids: [],
        sale_price: product.sale_price,  // ALWAYS use server price
        mrp: product.mrp,
        qty: item.qty,
        size: variant?.size || item.size,
        color: variant?.color || item.color || null,
        primary_image: product.images?.find((i: { is_primary: boolean }) => i.is_primary)?.url || product.images?.[0]?.url || null,
      };
    });

    // 5. Resolve prices server-side
    const offers = activeOffer ? [activeOffer] : [];
    const resolved = resolveOffers(cartItems, offers, { channel: "whatsapp", menu_id: source_menu_id || undefined });

    const subtotal = resolved.subtotal;
    const discountAmount = resolved.total_savings;
    const deliveryFee = 0; // Phase 1: free delivery
    const total = subtotal + deliveryFee;

    // 6. Upsert customer by phone
    const { data: customer } = await adminClient
      .from("customers")
      .upsert({
        phone: customer_phone,
        name: customer_name,
        email: customer_email || null,
        is_repeat: false,
      }, { onConflict: "phone", ignoreDuplicates: false })
      .select()
      .single();

    // 7. Create order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer?.id || null,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        shipping_address,
        subtotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        total,
        payment_method,
        payment_status: "pending",
        order_status: "placed",
        offer_id: activeOffer?.id || null,
        source_menu_id,
        source_channel: menu_slug ? "whatsapp" : "direct",
        internal_notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ data: null, error: orderError.message, success: false }, { status: 500 });
    }

    // 8. Insert order items with server-computed prices
    const itemRows = resolved.items.map(resolvedItem => ({
      order_id: order.id,
      product_id: resolvedItem.product_id,
      variant_id: resolvedItem.variant_id,
      product_title: resolvedItem.title,
      product_image: resolvedItem.primary_image || null,
      size: resolvedItem.size,
      color: resolvedItem.color || null,
      qty: resolvedItem.qty,
      unit_price: resolvedItem.offer_price,
      mrp: resolvedItem.mrp,
      subtotal: resolvedItem.line_total,
    }));
    await adminClient.from("order_items").insert(itemRows);

    // 9. Status log
    await adminClient.from("order_status_logs").insert({
      order_id: order.id,
      from_status: null,
      to_status: "placed",
      note: `Order placed via ${menu_slug ? "public menu: " + menu_slug : "direct checkout"}`,
    });

    return NextResponse.json({
      data: {
        order_number: order.order_number,
        order_id: order.id,
        total: order.total,
        discount_amount: order.discount_amount,
      },
      error: null,
      success: true,
    }, { status: 201 });

  } catch (err) {
    console.error("Public order creation error:", err);
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
