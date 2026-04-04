import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OffersTable } from "@/components/admin/offers/offers-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import type { Metadata } from "next";
import type { Offer } from "@/types";

export const metadata: Metadata = { title: "Offers" };

export default async function AdminOffersPage() {
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description={`${offers?.length ?? 0} total offers`}
        actions={
          <Link href="/admin/offers/new">
            <Button className="bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="h-4 w-4" /> New Offer
            </Button>
          </Link>
        }
      />
      <OffersTable offers={(offers as unknown as Offer[]) || []} />
    </div>
  );
}
