import { createClient } from "@/lib/supabase/server";
import { MenuForm } from "@/components/admin/menus/menu-form";
import { PageHeader } from "@/components/admin/shared/page-header";
import type { Metadata } from "next";
import type { Offer } from "@/types";

export const metadata: Metadata = { title: "New Menu" };

export default async function NewMenuPage() {
  const supabase = await createClient();
  const { data: offers } = await supabase.from("offers").select("id, name, offer_type, is_active").eq("is_active", true).order("priority");

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="New Public Menu" description="Create a shareable menu link for WhatsApp or direct ordering" />
      <MenuForm offers={(offers as unknown as Offer[]) || []} />
    </div>
  );
}
