import { createClient } from "@/lib/supabase/server";
import { CollectionForm } from "@/components/admin/collections/collection-form";
import { CollectionProductPicker } from "@/components/admin/collections/collection-product-picker";
import { PageHeader } from "@/components/admin/shared/page-header";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Collection" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: collection }, { data: productRows }] = await Promise.all([
    supabase.from("collections").select("*").eq("id", id).single(),
    supabase.from("product_collections")
      .select("product_id, product:products(id, title, slug, sale_price, mrp, images:product_images(url, is_primary))")
      .eq("collection_id", id),
  ]);

  if (!collection) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title={collection.name} description="Edit details and manage products" />

      {/* Edit basic info */}
      <CollectionForm
        collectionId={id}
        defaultValues={{
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          is_active: collection.is_active,
          sort_order: collection.sort_order,
        }}
      />

      <Separator />

      {/* Product picker */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Products in Collection</h2>
        <CollectionProductPicker
          collectionId={id}
          initialProducts={(productRows || []).map((r: { product: unknown }) => r.product as {
            id: string; title: string; slug: string; sale_price: number;
            images: { url: string; is_primary: boolean }[];
          })}
        />
      </div>
    </div>
  );
}
