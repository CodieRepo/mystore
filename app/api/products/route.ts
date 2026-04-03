import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations";

// GET /api/products — List products with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const status = searchParams.get("status") || ""; // active, draft, inactive
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("products")
      .select(
        `*, category:categories(id, name, slug), images:product_images(id, url, alt_text, sort_order, is_primary), variants:product_variants(id, size, color, color_hex, stock_qty, sku_variant)`,
        { count: "exact" }
      );

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq("category_id", category);
    }
    if (gender) {
      query = query.eq("gender", gender);
    }
    if (status === "active") {
      query = query.eq("is_active", true).eq("is_draft", false);
    } else if (status === "draft") {
      query = query.eq("is_draft", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    // Sort
    const ascending = order === "asc";
    query = query.order(sort, { ascending }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      per_page: perPage,
      success: true,
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// POST /api/products — Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin auth
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

    // Insert product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) {
      return NextResponse.json({ data: null, error: productError.message, success: false }, { status: 500 });
    }

    // Insert variants
    if (variants.length > 0) {
      const variantRows = variants.map((v, idx) => ({
        product_id: product.id,
        size: v.size,
        color: v.color || null,
        color_hex: v.color_hex || null,
        stock_qty: v.stock_qty,
        sku_variant: v.sku_variant || `${product.sku || product.id.slice(0, 8)}-${v.size}-${idx}`,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantRows);

      if (variantError) {
        console.error("Variant insert error:", variantError);
      }
    }

    // Insert images
    if (images.length > 0) {
      const imageRows = images.map((img) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text || null,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
      }));

      const { error: imageError } = await supabase
        .from("product_images")
        .insert(imageRows);

      if (imageError) {
        console.error("Image insert error:", imageError);
      }
    }

    // Insert collection links
    if (collection_ids.length > 0) {
      const collectionRows = collection_ids.map((cid) => ({
        product_id: product.id,
        collection_id: cid,
      }));

      const { error: collError } = await supabase
        .from("product_collections")
        .insert(collectionRows);

      if (collError) {
        console.error("Collection link error:", collError);
      }
    }

    return NextResponse.json({ data: product, error: null, success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
