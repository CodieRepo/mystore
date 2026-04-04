import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/menus/[id]/sections
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_menu_sections")
      .select("*, items:public_menu_items(id, item_type, product_id, collection_id, price_override, sort_order, product:products(id, title, slug, sale_price, mrp, images:product_images(url, is_primary)))")
      .eq("menu_id", id)
      .order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// POST /api/menus/[id]/sections — create section
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const { title, subtitle, sort_order = 0 } = body;
    if (!title) return NextResponse.json({ data: null, error: "Title required", success: false }, { status: 400 });

    const { data, error } = await supabase
      .from("public_menu_sections")
      .insert({ menu_id: id, title, subtitle: subtitle || null, sort_order })
      .select()
      .single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
