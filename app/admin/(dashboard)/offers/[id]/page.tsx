import { createClient } from "@/lib/supabase/server";
import { OfferForm } from "@/components/admin/offers/offer-form";
import { PageHeader } from "@/components/admin/shared/page-header";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Offer" };

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: offer }, { data: scopeData }, { data: categories }, { data: collections }] = await Promise.all([
    supabase.from("offers").select("*").eq("id", id).single(),
    supabase.from("offer_product_scope").select("product_id").eq("offer_id", id),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  if (!offer) notFound();

  const product_ids = (scopeData || []).map((s: { product_id: string }) => s.product_id);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit: ${offer.name}`} description="Modify offer rules and scope" />
      <OfferForm
        offerId={id}
        defaultValues={{ ...offer, product_ids, rules: offer.rules as Record<string, number> }}
        categories={categories || []}
        collections={collections || []}
      />
    </div>
  );
}
