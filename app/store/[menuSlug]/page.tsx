import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoreMenuClient } from "@/components/store/store-menu-client";

interface StorePageProps {
  params: Promise<{ menuSlug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { menuSlug } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "")}/api/store/menus/${menuSlug}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    const title = json.data?.menu?.name ?? "Shop";
    return { title, description: json.data?.menu?.description ?? "Shop our curated collection" };
  } catch {
    return { title: "Shop" };
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { menuSlug } = await params;

  // Fetch menu data server-side (SSR)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
  let menuData: {
    menu: {
      id: string; name: string; slug: string; description: string | null;
      checkout_mode: "whatsapp" | "direct"; whatsapp_number: string | null; offer_id: string | null;
    };
    sections: {
      id: string; title: string; sort_order: number;
      items: Array<{
        id: string; product: {
          id: string; title: string; slug: string; sale_price: number; mrp: number;
          is_active: boolean; primary_image: string | null; total_stock: number;
          variants: { id: string; size: string; color: string | null; color_hex: string | null; stock_qty: number }[];
        } | null;
        resolved_price: { offer_price: number; savings: number; offer_label: string | null; has_offer: boolean; original_price: number } | null;
      }>;
    }[];
    active_offer: { id: string; name: string; description: string | null; offer_type: string } | null;
  } | null = null;

  let expired = false;

  try {
    const res = await fetch(`${baseUrl}/api/store/menus/${menuSlug}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();

    if (res.status === 410 || json.expired) {
      expired = true;
    } else if (!json.success || !json.data) {
      notFound();
    } else {
      menuData = json.data;
    }
  } catch {
    notFound();
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold mb-2">This offer has ended</h1>
          <p className="text-muted-foreground">The link you followed is no longer active.</p>
        </div>
      </div>
    );
  }

  if (!menuData) notFound();

  return <StoreMenuClient menuData={menuData} menuSlug={menuSlug} />;
}
