"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import Link from "next/link";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  color_hex: string | null;
  stock_qty: number;
}

interface ProductData {
  id: string;
  title: string;
  slug: string;
  sale_price: number;
  mrp: number;
  is_active: boolean;
  primary_image: string | null;
  total_stock: number;
  variants: Variant[];
}

interface ResolvedPrice {
  offer_price: number;
  savings: number;
  offer_label: string | null;
  has_offer: boolean;
  original_price: number;
}

interface MenuItem {
  id: string;
  product: ProductData | null;
  resolved_price: ResolvedPrice | null;
}

interface Section {
  id: string;
  title: string;
  sort_order: number;
  items: MenuItem[];
}

interface MenuData {
  menu: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    checkout_mode: "whatsapp" | "direct";
    whatsapp_number: string | null;
    offer_id: string | null;
  };
  sections: Section[];
  active_offer: { id: string; name: string; description: string | null; offer_type: string } | null;
}

interface StoreMenuClientProps {
  menuData: MenuData;
  menuSlug: string;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function ProductCard({ item, checkoutMode, menuSlug }: {
  item: MenuItem;
  checkoutMode: "whatsapp" | "direct";
  menuSlug: string;
}) {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizes, setShowSizes] = useState(false);

  const product = item.product;
  const rp = item.resolved_price;
  if (!product || !product.is_active) return null;
  // Non-null alias for use in closures (TS can't narrow across closures after early return)
  const p = product;

  const sizes = [...new Set(p.variants?.map(v => v.size) ?? [])];
  const availableSizes = sizes.filter(size => {
    const variantsForSize = p.variants?.filter(v => v.size === size) ?? [];
    return variantsForSize.some(v => v.stock_qty > 0);
  });

  const displayPrice = rp?.offer_price ?? p.sale_price;
  const originalPrice = rp?.original_price ?? p.mrp;
  const hasOffer = rp?.has_offer ?? false;
  const savings = rp?.savings ?? 0;
  const offerLabel = rp?.offer_label;
  const isOutOfStock = p.total_stock === 0;
  const discountPct = originalPrice > displayPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;

  function handleAddToCart() {
    if (checkoutMode !== "direct") return;
    if (!selectedSize && availableSizes.length > 1) {
      setShowSizes(true);
      return;
    }
    const size = selectedSize || availableSizes[0] || sizes[0];
    const variant = p.variants?.find(v => v.size === size && v.stock_qty > 0) ?? p.variants?.[0];
    if (!variant) return;

    addItem({
      product_id: p.id,
      variant_id: variant.id,
      title: p.title,
      primary_image: p.primary_image,
      size,
      color: variant.color,
      offer_price: displayPrice,
      sale_price: p.sale_price,
      mrp: p.mrp,
      offer_label: offerLabel ?? null,
    });
    toast.success(`${p.title} (${size}) added to cart`);
    setShowSizes(false);
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {p.primary_image ? (
          <Image
            src={p.primary_image}
            alt={p.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">👗</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && <Badge variant="secondary" className="text-xs">Out of Stock</Badge>}
          {hasOffer && discountPct > 0 && !isOutOfStock && (
            <Badge className="text-xs bg-brand text-white">{discountPct}% off</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 mb-1">{p.title}</h3>

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold">{formatPrice(displayPrice)}</span>
            {originalPrice > displayPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>
          {offerLabel && <p className="text-xs text-brand font-medium mt-0.5">{offerLabel}</p>}
        </div>

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                className={`text-xs px-2 py-0.5 rounded border font-medium transition-colors ${
                  selectedSize === size
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border hover:border-brand/50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        {!isOutOfStock && checkoutMode === "direct" && (
          <Button
            className="w-full h-8 text-xs bg-brand hover:bg-brand-dark text-white"
            size="sm"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        )}
        {!isOutOfStock && checkoutMode === "whatsapp" && (
          <p className="text-xs text-muted-foreground text-center">Order via WhatsApp below</p>
        )}
      </div>
    </div>
  );
}

function CartDrawer({ menuSlug, checkoutMode }: { menuSlug: string; checkoutMode: "whatsapp" | "direct" }) {
  const { items, itemCount, total, removeItem, updateQty } = useCartStore();
  const [open, setOpen] = useState(false);

  if (checkoutMode !== "direct") return null;

  return (
    <>
      {/* Floating cart button */}
      {itemCount > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-40 bg-brand text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 hover:bg-brand-dark transition-colors"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-semibold">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
          <span>·</span>
          <span className="font-bold">{formatPrice(total)}</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-background rounded-t-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <h2 className="font-semibold">Your Cart ({itemCount})</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {items.map(item => (
                <div key={`${item.product_id}_${item.variant_id}_${item.size}`} className="flex gap-3">
                  {item.primary_image && (
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <Image src={item.primary_image} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.size}{item.color ? ` · ${item.color}` : ""}</p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(item.offer_price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.product_id, item.variant_id, item.size, item.qty - 1)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, item.variant_id, item.size, item.qty + 1)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => removeItem(item.product_id, item.variant_id, item.size)}
                        className="ml-auto text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="p-4 border-t space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Link href={`/store/${menuSlug}/checkout`} onClick={() => setOpen(false)}>
                  <Button className="w-full bg-brand hover:bg-brand-dark text-white h-12 text-base font-semibold">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function StoreMenuClient({ menuData, menuSlug }: StoreMenuClientProps) {
  const { setMenuSlug } = useCartStore();
  const { menu, sections, active_offer } = menuData;

  useEffect(() => {
    setMenuSlug(menuSlug);
  }, [menuSlug, setMenuSlug]);

  const allItems = sections.flatMap(s => s.items.filter(i => i.product && i.product.is_active));

  // WhatsApp message builder
  function buildWhatsAppMessage() {
    const lines = [
      `Hi! I'd like to order from *${menu.name}*:`,
      "",
      ...allItems.slice(0, 20).map(item => `• ${item.product?.title} – ${formatPrice(item.resolved_price?.offer_price ?? item.product?.sale_price ?? 0)}`),
      "",
      active_offer ? `🏷️ Offer: ${active_offer.name}` : "",
      "Please share payment details. Thank you!",
    ].filter(l => l !== "");

    return encodeURIComponent(lines.join("\n"));
  }

  const waNumber = menu.whatsapp_number || "";
  const waLink = `https://wa.me/${waNumber}?text=${buildWhatsAppMessage()}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="container-store py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg heading-editorial">{menu.name}</h1>
              {menu.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{menu.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Offer Banner */}
      {active_offer && (
        <div className="bg-brand text-white text-center py-2 px-4 text-sm font-medium">
          🏷️ {active_offer.name}
          {active_offer.description && ` — ${active_offer.description}`}
        </div>
      )}

      {/* Main content */}
      <main className="container-store py-6 space-y-10">
        {sections.map(section => {
          const validItems = section.items.filter(i => i.product && i.product.is_active);
          if (validItems.length === 0) return null;
          return (
            <section key={section.id}>
              <h2 className="text-xl font-bold mb-4 heading-editorial">{section.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {validItems.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    checkoutMode={menu.checkout_mode}
                    menuSlug={menuSlug}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* WhatsApp CTA */}
      {menu.checkout_mode === "whatsapp" && waNumber && (
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 text-base font-semibold bg-[#25D366] hover:bg-[#20C05A] text-white gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.546 4.09 1.508 5.808L0 24l6.344-1.492A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.891 0-3.67-.483-5.22-1.334l-.374-.22-3.77.887.93-3.664-.242-.376A9.6 9.6 0 012.4 12C2.4 6.703 6.703 2.4 12 2.4c5.297 0 9.6 4.303 9.6 9.6s-4.303 9.6-9.6 9.6z"/></svg>
              Order on WhatsApp
            </Button>
          </a>
        </div>
      )}

      {/* Direct checkout cart */}
      <CartDrawer menuSlug={menuSlug} checkoutMode={menu.checkout_mode} />
    </div>
  );
}
