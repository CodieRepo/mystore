import { createClient } from "@/lib/supabase/server";
import { MenuForm } from "@/components/admin/menus/menu-form";
import { MenuSectionEditor } from "@/components/admin/menus/menu-section-editor";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import type { Offer, PublicMenuSection } from "@/types";

export const metadata: Metadata = { title: "Edit Menu" };

export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: menu }, { data: offers }, { data: sections }] = await Promise.all([
    supabase.from("public_menus").select("*").eq("id", id).single(),
    supabase.from("offers").select("id, name, offer_type, is_active").eq("is_active", true).order("priority"),
    supabase.from("public_menu_sections")
      .select(`*, items:public_menu_items(*, product:products(id, title, slug, sale_price, mrp, images:product_images(url, is_primary)))`)
      .eq("menu_id", id)
      .order("sort_order"),
  ]);

  if (!menu) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/store/${menu.slug}`;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title={menu.name}
        description={`/store/${menu.slug}`}
        actions={
          <div className="flex gap-2">
            <Link href={publicUrl} target="_blank">
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </Button>
            </Link>
          </div>
        }
      />

      <MenuForm
        menuId={id}
        offers={(offers as unknown as Offer[]) || []}
        defaultValues={{
          name: menu.name,
          slug: menu.slug,
          description: menu.description,
          offer_id: menu.offer_id,
          checkout_mode: menu.checkout_mode,
          whatsapp_number: menu.whatsapp_number,
          is_active: menu.is_active,
          expires_at: menu.expires_at,
          utm_source: menu.utm_source,
          utm_medium: menu.utm_medium,
          utm_campaign: menu.utm_campaign,
        }}
      />

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-2">Menu Sections</h2>
        <p className="text-sm text-muted-foreground mb-6">Add sections and products to build your menu layout.</p>
        <MenuSectionEditor
          menuId={id}
          initialSections={(sections as unknown as PublicMenuSection[]) || []}
        />
      </div>
    </div>
  );
}
