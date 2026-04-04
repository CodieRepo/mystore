import { createClient } from "@/lib/supabase/server";
import { OfferForm } from "@/components/admin/offers/offer-form";
import { PageHeader } from "@/components/admin/shared/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Offer" };

export default async function NewOfferPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: collections }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("collections").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="New Offer" description="Create a discount offer for your products" />
      <OfferForm categories={categories || []} collections={collections || []} />
    </div>
  );
}
