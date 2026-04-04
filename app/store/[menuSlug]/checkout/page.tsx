import { CheckoutClient } from "@/components/store/checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ menuSlug: string }> }) {
  const { menuSlug } = await params;
  return <CheckoutClient menuSlug={menuSlug} />;
}
