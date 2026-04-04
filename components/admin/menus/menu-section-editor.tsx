"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import type { PublicMenuSection, PublicMenuItem } from "@/types";

interface MenuSectionEditorProps {
  menuId: string;
  initialSections: PublicMenuSection[];
}

export function MenuSectionEditor({ menuId, initialSections }: MenuSectionEditorProps) {
  const router = useRouter();
  const [sections, setSections] = useState<PublicMenuSection[]>(initialSections);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, { id: string; title: string; sale_price: number; images: { url: string; is_primary: boolean }[] }[]>>({});
  const [loading, setLoading] = useState(false);

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menus/${menuId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSectionTitle, sort_order: sections.length }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSections(prev => [...prev, { ...json.data, items: [] }]);
      setNewSectionTitle("");
      toast.success("Section added");
    } catch {
      toast.error("Failed to add section");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Delete this section and all its items?")) return;
    setLoading(true);
    try {
      await fetch(`/api/menus/${menuId}/sections/${sectionId}`, { method: "DELETE" });
      setSections(prev => prev.filter(s => s.id !== sectionId));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts(sectionId: string, query: string) {
    setProductSearch(prev => ({ ...prev, [sectionId]: query }));
    if (query.length < 2) {
      setSearchResults(prev => ({ ...prev, [sectionId]: [] }));
      return;
    }
    const res = await fetch(`/api/products?search=${query}&per_page=8`);
    const json = await res.json();
    const section = sections.find(s => s.id === sectionId);
    const existingIds = new Set((section?.items || []).map(i => i.product_id));
    setSearchResults(prev => ({
      ...prev,
      [sectionId]: (json.data || []).filter((p: { id: string }) => !existingIds.has(p.id)),
    }));
  }

  async function addItem(sectionId: string, product: { id: string; title: string; sale_price: number; images: { url: string; is_primary: boolean }[] }) {
    setLoading(true);
    try {
      const section = sections.find(s => s.id === sectionId);
      const sortOrder = section?.items?.length ?? 0;
      const res = await fetch(`/api/menus/${menuId}/sections/${sectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: "product", product_id: product.id, sort_order: sortOrder }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSections(prev => prev.map(s => s.id === sectionId
        ? { ...s, items: [...(s.items || []), json.data] }
        : s
      ));
      setProductSearch(prev => ({ ...prev, [sectionId]: "" }));
      setSearchResults(prev => ({ ...prev, [sectionId]: [] }));
      toast.success("Product added");
    } catch {
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(sectionId: string, itemId: string) {
    setLoading(true);
    try {
      await fetch(`/api/menus/${menuId}/sections/${sectionId}/items/${itemId}`, { method: "DELETE" });
      setSections(prev => prev.map(s => s.id === sectionId
        ? { ...s, items: (s.items || []).filter(i => i.id !== itemId) }
        : s
      ));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add section */}
      <div className="flex gap-3">
        <Input
          placeholder="New section title (e.g. Bestsellers, New Arrivals)"
          value={newSectionTitle}
          onChange={e => setNewSectionTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSection())}
        />
        <Button onClick={addSection} disabled={loading || !newSectionTitle.trim()} className="bg-brand hover:bg-brand-dark text-white gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No sections yet. Add one above to start building this menu.</p>
      )}

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSection(section.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Items */}
            {(section.items || []).map((item) => {
              const product = item.product;
              if (!product) return null;
              const img = product.images?.find((i: { is_primary: boolean }) => i.is_primary)?.url ?? product.images?.[0]?.url;
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  {img && <Image src={img} alt={product.title ?? ""} width={36} height={36} className="rounded object-cover w-9 h-9 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">₹{product.sale_price}</p>
                  </div>
                  {item.price_override && (
                    <Badge variant="secondary" className="text-xs shrink-0">Override: ₹{item.price_override}</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(section.id, item.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search and add products..."
                className="pl-9 text-sm"
                value={productSearch[section.id] ?? ""}
                onChange={e => searchProducts(section.id, e.target.value)}
              />
            </div>
            {(searchResults[section.id] || []).length > 0 && (
              <div className="border border-border rounded-lg divide-y overflow-hidden">
                {(searchResults[section.id] || []).map(p => {
                  const img = p.images?.find(i => i.is_primary)?.url ?? p.images?.[0]?.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => addItem(section.id, p)}
                    >
                      {img && <Image src={img} alt={p.title} width={28} height={28} className="rounded object-cover w-7 h-7 shrink-0" />}
                      <span className="flex-1 min-w-0 truncate">{p.title}</span>
                      <span className="text-muted-foreground shrink-0">₹{p.sale_price}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
