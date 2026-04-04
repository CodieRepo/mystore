"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { menuSchema, type MenuFormData } from "@/lib/validations";
import { CHECKOUT_MODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Offer } from "@/types";

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface MenuFormProps {
  defaultValues?: Partial<MenuFormData>;
  menuId?: string;
  offers: Offer[];
}

export function MenuForm({ defaultValues, menuId, offers }: MenuFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: null,
      offer_id: null,
      checkout_mode: "whatsapp",
      whatsapp_number: null,
      is_active: true,
      expires_at: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      ...defaultValues,
    },
  });

  const checkoutMode = form.watch("checkout_mode");

  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (!form.getValues("slug")) form.setValue("slug", toSlug(e.target.value));
  }

  async function onSubmit(data: MenuFormData) {
    setIsLoading(true);
    try {
      const method = menuId ? "PUT" : "POST";
      const url = menuId ? `/api/menus/${menuId}` : "/api/menus";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(menuId ? "Menu updated" : "Menu created");
      if (!menuId) router.push(`/admin/menus/${json.data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const activeOffers = offers.filter(o => o.is_active);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic */}
        <Card>
          <CardHeader><CardTitle className="text-base">Menu Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Summer Drop, Diwali Collection" {...field} onBlur={handleNameBlur} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl><Input placeholder="summer-drop" {...field} /></FormControl>
                <FormDescription className="text-xs">Public URL: /store/{form.watch("slug") || "your-slug"}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Shown at the top of the public menu page" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Offer */}
        <Card>
          <CardHeader><CardTitle className="text-base">Linked Offer</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="offer_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Offer (Optional)</FormLabel>
                <Select onValueChange={v => field.onChange(v === "none" ? null : v)} defaultValue={field.value ?? "none"}>
                  <FormControl><SelectTrigger><SelectValue placeholder="None — regular prices" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None — regular prices</SelectItem>
                    {activeOffers.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">Customers browsing this menu see offer-applied prices</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Checkout Mode */}
        <Card>
          <CardHeader><CardTitle className="text-base">Checkout Mode</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="checkout_mode" render={({ field }) => (
              <FormItem>
                <FormLabel>Mode *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CHECKOUT_MODES.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div>
                          <p className="font-medium">{m.label}</p>
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {checkoutMode === "whatsapp" && (
              <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <FormControl><Input placeholder="919876543210 (with country code, no +)" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Settings & Validity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="expires_at" render={({ field }) => (
              <FormItem>
                <FormLabel>Expires At (Optional)</FormLabel>
                <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Active (visible to public)</FormLabel>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand-dark text-white">
            {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : menuId ? "Update Menu" : "Create Menu"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
}
