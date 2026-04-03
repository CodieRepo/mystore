import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/products/product-form";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: collections }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `*, images:product_images(id, url, alt_text, sort_order, is_primary), variants:product_variants(id, size, color, color_hex, stock_qty, sku_variant), product_collections(collection_id)`
      )
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name, slug").eq("is_active", true).order("sort_order"),
  ]);

  if (!product) {
    notFound();
  }

  // Map collection IDs from join table
  const productWithCollections = {
    ...product,
    collection_ids: product.product_collections?.map((pc: { collection_id: string }) => pc.collection_id) || [],
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update &ldquo;{product.title}&rdquo;
        </p>
      </div>

      <ProductForm
        product={productWithCollections}
        categories={categories || []}
        collections={collections || []}
      />
    </div>
  );
}
