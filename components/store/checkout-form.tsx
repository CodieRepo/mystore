"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/lib/store/cart-store";
import { INDIAN_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const checkoutFormSchema = z.object({
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z.string().min(10).max(15),
  customer_email: z.string().email().optional().or(z.literal("")),
  shipping_address: z.object({
    line1: z.string().min(5, "Address is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City required"),
    state: z.string().min(2, "State required"),
    pincode: z.string().length(6, "6-digit pincode required"),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

interface CheckoutClientProps {
  menuSlug: string;
}

export function CheckoutClient({ menuSlug }: CheckoutClientProps) {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      shipping_address: { line1: "", line2: "", city: "", state: "", pincode: "" },
    },
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-3">🛒</p>
          <h1 className="font-bold text-xl mb-2">Your cart is empty</h1>
          <Link href={`/store/${menuSlug}`}>
            <Button variant="outline" className="mt-3">Back to Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(data: CheckoutFormData) {
    setLoading(true);
    try {
      const payload = {
        menu_slug: menuSlug,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        payment_method: "COD",
        shipping_address: data.shipping_address,
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          qty: item.qty,
          size: item.size,
          color: item.color,
        })),
      };

      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      clearCart();
      router.push(`/store/${menuSlug}/confirm?order=${json.data.order_number}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="container-store py-3 flex items-center gap-3">
          <Link href={`/store/${menuSlug}`}><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-bold text-lg">Checkout</h1>
        </div>
      </header>

      <div className="container-store py-6 max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact */}
            <div className="rounded-xl border border-border p-4 space-y-4">
              <h2 className="font-semibold">Contact Details</h2>
              <FormField control={form.control} name="customer_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customer_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl><Input placeholder="10-digit mobile number" type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customer_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl><Input placeholder="email@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Address */}
            <div className="rounded-xl border border-border p-4 space-y-4">
              <h2 className="font-semibold">Delivery Address</h2>
              <FormField control={form.control} name="shipping_address.line1" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl><Input placeholder="House No., Street, Area" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shipping_address.line2" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl><Input placeholder="Landmark (optional)" {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="shipping_address.city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl><Input placeholder="Mumbai" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="shipping_address.pincode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode *</FormLabel>
                    <FormControl><Input placeholder="400001" maxLength={6} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="shipping_address.state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h2 className="font-semibold">Order Summary</h2>
              {items.map(item => (
                <div key={`${item.product_id}_${item.variant_id}_${item.size}`} className="flex items-center gap-3">
                  {item.primary_image && (
                    <Image src={item.primary_image} alt={item.title} width={40} height={52} className="rounded object-cover w-10 h-14 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.size} × {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{(item.offer_price * item.qty).toLocaleString("en-IN")}</p>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total (COD)</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-brand hover:bg-brand-dark text-white">
              {loading
                ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Placing Order...</>
                : "Place Order (Cash on Delivery)"
              }
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
