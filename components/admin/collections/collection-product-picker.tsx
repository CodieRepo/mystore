"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, X, Plus } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  slug: string;
  sale_price: number;
  images?: { url: string; is_primary: boolean }[];
}

interface CollectionProductPickerProps {
  collectionId: string;
  initialProducts: Product[];
}

export function CollectionProductPicker({ collectionId, initialProducts }: CollectionProductPickerProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${search}&per_page=10`);
      const json = await res.json();
      const found = (json.data || []).filter((p: Product) => !products.find(ep => ep.id === p.id));
      setResults(found);
    }, 300);
    return () => clearTimeout(t);
  }, [search, products]);

  async function addProduct(product: Product) {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: [product.id] }),
      });
      if (!(await res.json()).success) throw new Error();
      setProducts(prev => [...prev, product]);
      setSearch("");
      setResults([]);
      toast.success("Product added");
    } catch {
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  }

  async function removeProduct(productId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: [productId] }),
      });
      if (!(await res.json()).success) throw new Error();
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product removed");
    } catch {
      toast.error("Failed to remove product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products to add..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="border border-border rounded-lg divide-y overflow-hidden">
          {results.map(p => {
            const img = p.images?.find(i => i.is_primary)?.url ?? p.images?.[0]?.url;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                {img && <Image src={img} alt={p.title} width={36} height={36} className="rounded object-cover w-9 h-9" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">₹{p.sale_price}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => addProduct(p)} disabled={loading}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Current products */}
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No products in this collection yet.</p>
      ) : (
        <div className="rounded-lg border border-border divide-y overflow-hidden">
          {products.map(p => {
            const img = p.images?.find(i => i.is_primary)?.url ?? p.images?.[0]?.url;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                {img && <Image src={img} alt={p.title} width={36} height={36} className="rounded object-cover w-9 h-9" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">₹{p.sale_price}</p>
                </div>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removeProduct(p.id)} disabled={loading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
