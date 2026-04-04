import { createClient } from "@/lib/supabase/server";
import { CollectionsTable } from "@/components/admin/collections/collections-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import type { Collection } from "@/types";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description={`${collections?.length ?? 0} collections`}
        actions={
          <Link href="/admin/collections/new">
            <Button className="bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="h-4 w-4" /> New Collection
            </Button>
          </Link>
        }
      />
      <CollectionsTable collections={(collections as Collection[]) || []} />
    </div>
  );
}
