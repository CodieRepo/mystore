import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/menus/[id]/sections/[sid]/items — add item
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  try {
    const { sid } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const { item_type = "product", product_id, collection_id, price_override, sort_order = 0 } = body;

    if (item_type === "product" && !product_id) {
      return NextResponse.json({ data: null, error: "product_id required for product item", success: false }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("public_menu_items")
      .insert({
        section_id: sid,
        item_type,
        product_id: product_id || null,
        collection_id: collection_id || null,
        price_override: price_override || null,
        sort_order,
      })
      .select("*, product:products(id, title, slug, sale_price, mrp, images:product_images(url, is_primary))")
      .single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
