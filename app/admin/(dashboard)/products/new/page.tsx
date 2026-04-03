import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/products/product-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Product",
};

export default async function AddProductPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: collections }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name, slug").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new product in your store catalog
        </p>
      </div>

      <ProductForm
        categories={categories || []}
        collections={collections || []}
      />
    </div>
  );
}
