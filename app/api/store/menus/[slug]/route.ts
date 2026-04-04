import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOffers, resolveProductDisplayPrice } from "@/lib/offer-engine";
import type { Offer, CartItem } from "@/lib/offer-engine/types";

// GET /api/store/menus/[slug] — public, no auth required
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch menu with full tree
    const { data: menu, error: menuError } = await supabase
      .from("public_menus")
      .select(`
        *,
        offer:offers(
          id, name, description, offer_type, scope_type, scope_ref_id,
          rules, applicable_channels, valid_from, valid_until, is_active, priority, is_combinable
        ),
        sections:public_menu_sections(
          id, title, subtitle, sort_order,
          items:public_menu_items(
            id, item_type, product_id, collection_id, price_override, sort_order,
            product:products(
              id, title, slug, description, highlights, category_id, gender,
              mrp, sale_price, is_active, is_draft, tags, material,
              images:product_images(id, url, alt_text, sort_order, is_primary),
              variants:product_variants(id, size, color, color_hex, stock_qty, sku_variant)
            )
          )
        )
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (menuError || !menu) {
      return NextResponse.json({ data: null, error: "Menu not found or inactive", success: false }, { status: 404 });
    }

    // Check expiry
    if (menu.expires_at && new Date(menu.expires_at) < new Date()) {
      return NextResponse.json({ data: null, error: "This menu has expired", success: false, expired: true }, { status: 410 });
    }

    // Build offer context
    const offer = menu.offer as Offer | null;
    const offers: Offer[] = [];

    if (offer && offer.is_active) {
      // Load product_ids for product_set scope
      if (offer.scope_type === "product_set") {
        const { data: scopeData } = await supabase
          .from("offer_product_scope")
          .select("product_id")
          .eq("offer_id", offer.id);
        offer.product_ids = (scopeData || []).map((s: { product_id: string }) => s.product_id);
      }
      offers.push(offer);
    }

    // Sort sections and items
    const sortedSections = (menu.sections || [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((section: {
        id: string; title: string; subtitle: string | null; sort_order: number;
        items: Array<{
          id: string; item_type: string; product_id: string | null; sort_order: number; price_override: number | null;
          product: {
            id: string; title: string; slug: string; sale_price: number; mrp: number; category_id: string | null;
            is_active: boolean; is_draft: boolean; images: Array<{ is_primary: boolean; url: string }>;
            variants: Array<{ id: string; size: string; stock_qty: number }>;
          } | null;
        }>;
      }) => {
        const sortedItems = (section.items || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => {
            const product = item.product;

            // Skip inactive or draft products
            if (!product || !product.is_active || product.is_draft) {
              return { ...item, product: null, resolved_price: null };
            }

            const primaryImage = product.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url
              ?? product.images?.[0]?.url ?? null;

            // Resolve offer price for this product
            const collectionIds: string[] = []; // Could fetch if needed
            const displayPrice = resolveProductDisplayPrice(
              {
                id: product.id,
                category_id: product.category_id,
                collection_ids: collectionIds,
                sale_price: item.price_override ?? product.sale_price,
                mrp: product.mrp,
              },
              offers,
              { channel: "whatsapp" }
            );

            const totalStock = product.variants?.reduce((sum: number, v: { stock_qty: number }) => sum + (v.stock_qty || 0), 0) ?? 0;

            return {
              ...item,
              product: {
                ...product,
                primary_image: primaryImage,
                total_stock: totalStock,
              },
              resolved_price: {
                offer_price: displayPrice.offer_price,
                savings: displayPrice.savings,
                offer_label: displayPrice.offer_label,
                has_offer: displayPrice.has_offer,
                original_price: item.price_override ?? product.sale_price,
              },
            };
          })
          .filter((item) => item !== null);

        return { ...section, items: sortedItems };
      });

    return NextResponse.json({
      data: {
        menu: {
          id: menu.id,
          name: menu.name,
          slug: menu.slug,
          description: menu.description,
          checkout_mode: menu.checkout_mode,
          whatsapp_number: menu.whatsapp_number,
          offer_id: menu.offer_id,
          utm_source: menu.utm_source,
          utm_medium: menu.utm_medium,
          utm_campaign: menu.utm_campaign,
          expires_at: menu.expires_at,
        },
        active_offer: offer || null,
        sections: sortedSections,
      },
      error: null,
      success: true,
    });
  } catch (err) {
    console.error("Menu resolve error:", err);
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
