import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductsTable } from "@/components/admin/products/products-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page || "1");
  const perPage = 15;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const search = params.search || "";
  const categoryFilter = params.category || "";
  const genderFilter = params.gender || "";
  const statusFilter = params.status || "";

  let query = supabase
    .from("products")
    .select(
      `*, category:categories(id, name), images:product_images(url, is_primary), variants:product_variants(stock_qty)`,
      { count: "exact" }
    );

  if (search) {
    query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (categoryFilter) {
    query = query.eq("category_id", categoryFilter);
  }
  if (genderFilter) {
    query = query.eq("gender", genderFilter);
  }
  if (statusFilter === "active") {
    query = query.eq("is_active", true).eq("is_draft", false);
  } else if (statusFilter === "draft") {
    query = query.eq("is_draft", true);
  } else if (statusFilter === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: products, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  // Fetch categories for filter dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {count || 0} total products
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-brand hover:bg-brand-dark text-white gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductsTable
        products={products || []}
        categories={categories || []}
        totalPages={totalPages}
        currentPage={page}
        search={search}
        categoryFilter={categoryFilter}
        genderFilter={genderFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
