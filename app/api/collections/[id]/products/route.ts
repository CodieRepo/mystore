import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/collections/[id]/products — products in this collection
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_collections")
      .select("product_id, product:products(id, title, slug, sale_price, mrp, is_active, images:product_images(url, is_primary))")
      .eq("collection_id", id);
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// POST /api/collections/[id]/products — add products { product_ids: string[] }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { product_ids } = await request.json();
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ data: null, error: "product_ids array required", success: false }, { status: 400 });
    }

    const rows = product_ids.map((pid: string) => ({ collection_id: id, product_id: pid }));
    const { error } = await supabase.from("product_collections").upsert(rows, { onConflict: "product_id,collection_id" });
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data: null, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// DELETE /api/collections/[id]/products — remove products { product_ids: string[] }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { product_ids } = await request.json();
    if (!Array.isArray(product_ids)) {
      return NextResponse.json({ data: null, error: "product_ids array required", success: false }, { status: 400 });
    }

    const { error } = await supabase
      .from("product_collections")
      .delete()
      .eq("collection_id", id)
      .in("product_id", product_ids);
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data: null, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
