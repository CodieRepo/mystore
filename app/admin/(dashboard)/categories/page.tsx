import { createClient } from "@/lib/supabase/server";
import { CategoriesTable } from "@/components/admin/categories/categories-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import { CategoryForm } from "@/components/admin/categories/category-form";
import type { Metadata } from "next";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description={`${categories?.length ?? 0} categories`}
        actions={<CategoryForm />}
      />
      <CategoriesTable categories={(categories as Category[]) || []} />
    </div>
  );
}
