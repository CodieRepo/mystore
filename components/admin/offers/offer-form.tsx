"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { offerSchema, type OfferFormData } from "@/lib/validations";
import { OFFER_TYPES, SCOPE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { X, Loader2, Search } from "lucide-react";
// Minimal shape — pages only select id + name for the scope dropdowns
interface ScopeOption { id: string; name: string; }

interface OfferFormProps {
  defaultValues?: Partial<OfferFormData>;
  offerId?: string;
  categories: ScopeOption[];
  collections: ScopeOption[];
}

export function OfferForm({ defaultValues, offerId, categories, collections }: OfferFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; sale_price: number }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; title: string; sale_price: number }[]>([]);

  const form = useForm<OfferFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(offerSchema as any),
    defaultValues: {
      name: "",
      description: "",
      offer_type: "percentage",
      scope_type: "all",
      scope_ref_id: null,
      rules: {},
      applicable_channels: [],
      valid_from: null,
      valid_until: null,
      is_active: true,
      priority: 100,
      is_combinable: false,
      product_ids: [],
      ...defaultValues,
    },
  });

  const watchedType = form.watch("offer_type");
  const watchedScope = form.watch("scope_type");

  // Search products
  useEffect(() => {
    if (productSearch.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${productSearch}&per_page=8`);
      const json = await res.json();
      setSearchResults(json.data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  function addProduct(product: { id: string; title: string; sale_price: number }) {
    if (!selectedProducts.find(p => p.id === product.id)) {
      const next = [...selectedProducts, product];
      setSelectedProducts(next);
      form.setValue("product_ids", next.map(p => p.id));
    }
    setProductSearch("");
    setSearchResults([]);
  }

  function removeProduct(id: string) {
    const next = selectedProducts.filter(p => p.id !== id);
    setSelectedProducts(next);
    form.setValue("product_ids", next.map(p => p.id));
  }

  async function onSubmit(data: OfferFormData) {
    setIsLoading(true);
    try {
      const method = offerId ? "PUT" : "POST";
      const url = offerId ? `/api/offers/${offerId}` : "/api/offers";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(offerId ? "Offer updated" : "Offer created");
      router.push("/admin/offers");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Summer Sale, Buy 2 Get Flat ₹500 Off" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Displayed to customers on the storefront" rows={2} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormDescription className="text-xs">Lower number = higher priority</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex flex-col gap-4 pt-2">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 mt-4">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_combinable" render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Combinable with other offers</FormLabel>
                  </FormItem>
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Type + Rules */}
        <Card>
          <CardHeader><CardTitle className="text-base">Offer Type & Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="offer_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select offer type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OFFER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <p className="font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Dynamic rules based on type */}
            {watchedType === "fixed_price" && (
              <FormField control={form.control} name="rules.price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fixed Price (₹) *</FormLabel>
                  <FormControl><Input type="number" placeholder="399" {...field} value={field.value ?? ""} /></FormControl>
                  <FormDescription className="text-xs">Each eligible item will be priced at this amount</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchedType === "percentage" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="rules.pct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount % *</FormLabel>
                    <FormControl><Input type="number" placeholder="20" min={1} max={100} {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rules.max_discount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Discount (₹)</FormLabel>
                    <FormControl><Input type="number" placeholder="500" {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription className="text-xs">Optional ceiling</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {watchedType === "flat" && (
              <FormField control={form.control} name="rules.amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Discount Amount (₹) *</FormLabel>
                  <FormControl><Input type="number" placeholder="100" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchedType === "combo_fixed" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="rules.qty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Qty *</FormLabel>
                    <FormControl><Input type="number" placeholder="2" min={2} {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription className="text-xs">Any N items trigger the deal</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rules.price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combo Price (₹) *</FormLabel>
                    <FormControl><Input type="number" placeholder="999" {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription className="text-xs">Total price for N items</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope */}
        <Card>
          <CardHeader><CardTitle className="text-base">Scope</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="scope_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Apply To *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCOPE_TYPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <p className="font-medium">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {watchedScope === "category" && (
              <FormField control={form.control} name="scope_ref_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchedScope === "collection" && (
              <FormField control={form.control} name="scope_ref_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchedScope === "product_set" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products to add..."
                    className="pl-9"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-lg divide-y overflow-hidden">
                    {searchResults.map(p => (
                      <button key={p.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex justify-between" onClick={() => addProduct(p)}>
                        <span>{p.title}</span>
                        <span className="text-muted-foreground">₹{p.sale_price}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map(p => (
                      <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
                        {p.title}
                        <button type="button" onClick={() => removeProduct(p.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validity */}
        <Card>
          <CardHeader><CardTitle className="text-base">Validity</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="valid_from" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="valid_until" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand-dark text-white">
            {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : (offerId ? "Update Offer" : "Create Offer")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
}
