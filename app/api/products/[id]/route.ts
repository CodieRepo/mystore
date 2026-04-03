import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations";

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `*, category:categories(id, name, slug), images:product_images(id, url, alt_text, sort_order, is_primary), variants:product_variants(id, size, color, color_hex, stock_qty, sku_variant), collections:product_collections(collection_id, collections(id, name, slug))`
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 404 });
    }

    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });
    }

    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(", "),
        success: false,
      }, { status: 400 });
    }

    const { variants, images, collection_ids, ...productData } = parsed.data;

    // Update product
    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ data: null, error: updateError.message, success: false }, { status: 500 });
    }

    // Replace variants: delete all, re-insert
    await supabase.from("product_variants").delete().eq("product_id", id);
    if (variants.length > 0) {
      const variantRows = variants.map((v, idx) => ({
        product_id: id,
        size: v.size,
        color: v.color || null,
        color_hex: v.color_hex || null,
        stock_qty: v.stock_qty,
        sku_variant: v.sku_variant || `${product.sku || id.slice(0, 8)}-${v.size}-${idx}`,
      }));
      await supabase.from("product_variants").insert(variantRows);
    }

    // Replace images: delete all, re-insert
    await supabase.from("product_images").delete().eq("product_id", id);
    if (images.length > 0) {
      const imageRows = images.map((img) => ({
        product_id: id,
        url: img.url,
        alt_text: img.alt_text || null,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    // Replace collection links
    await supabase.from("product_collections").delete().eq("product_id", id);
    if (collection_ids.length > 0) {
      const collectionRows = collection_ids.map((cid) => ({
        product_id: id,
        collection_id: cid,
      }));
      await supabase.from("product_collections").insert(collectionRows);
    }

    return NextResponse.json({ data: product, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    }

    return NextResponse.json({ data: { id }, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
