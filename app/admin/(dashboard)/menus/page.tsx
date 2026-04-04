import { createClient } from "@/lib/supabase/server";
import { MenusTable } from "@/components/admin/menus/menus-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { PublicMenu } from "@/types";

export const metadata: Metadata = { title: "Public Menus" };

export default async function AdminMenusPage() {
  const supabase = await createClient();
  const { data: menus } = await supabase
    .from("public_menus")
    .select("*, offer:offers(id, name, offer_type)")
    .order("created_at", { ascending: false });

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Menus"
        description="Shareable product menus for WhatsApp and direct ordering"
        actions={
          <Link href="/admin/menus/new">
            <Button className="bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="h-4 w-4" /> New Menu
            </Button>
          </Link>
        }
      />
      <MenusTable menus={(menus as unknown as PublicMenu[]) || []} baseUrl={baseUrl} />
    </div>
  );
}
