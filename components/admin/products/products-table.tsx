"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  Package, Filter
} from "lucide-react";
import { GENDERS } from "@/lib/constants";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  mrp: number;
  sale_price: number;
  discount_pct: number;
  gender: string;
  is_active: boolean;
  is_draft: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_trending: boolean;
  created_at: string;
  category: { id: string; name: string } | null;
  images: { url: string; is_primary: boolean }[];
  variants: { stock_qty: number }[];
}

interface Props {
  products: ProductRow[];
  categories: { id: string; name: string }[];
  totalPages: number;
  currentPage: number;
  search: string;
  categoryFilter: string;
  genderFilter: string;
  statusFilter: string;
}

export function ProductsTable({
  products, categories, totalPages, currentPage,
  search: initialSearch, categoryFilter, genderFilter, statusFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateFilters = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/admin/products?${params.toString()}`);
  }, [router, searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters("search", search);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function getStatusBadge(product: ProductRow) {
    if (product.is_draft) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px]">Draft</Badge>;
    if (!product.is_active) return <Badge variant="secondary" className="bg-red-100 text-red-800 text-[10px]">Inactive</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">Active</Badge>;
  }

  function getTotalStock(variants: { stock_qty: number }[]) {
    return variants.reduce((sum, v) => sum + v.stock_qty, 0);
  }

  function getPrimaryImage(images: { url: string; is_primary: boolean }[]) {
    const primary = images?.find((img) => img.is_primary);
    return primary?.url || images?.[0]?.url || null;
  }

  function navigatePage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </form>

        <Select value={categoryFilter} onValueChange={(v) => updateFilters("category", v === "all" ? "" : v || "")}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={(v) => updateFilters("gender", v === "all" ? "" : v || "")}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {GENDERS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => updateFilters("status", v === "all" ? "" : v || "")}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[50px]">Image</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Flags</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imgUrl = getPrimaryImage(product.images);
                  const totalStock = getTotalStock(product.variants);
                  return (
                    <tr key={product.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center">
                          {imgUrl ? (
                            <Image src={imgUrl} alt={product.title} width={40} height={40} className="object-cover h-full w-full" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{product.title}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.category?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">₹{Number(product.sale_price).toLocaleString("en-IN")}</span>
                          {product.discount_pct > 0 && (
                            <span className="ml-1.5 text-xs text-green-600">-{product.discount_pct}%</span>
                          )}
                        </div>
                        {product.mrp !== product.sale_price && (
                          <span className="text-xs text-muted-foreground line-through">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${totalStock === 0 ? "text-red-500" : totalStock < 5 ? "text-amber-500" : "text-foreground"}`}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(product)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {product.is_featured && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Featured</Badge>}
                          {product.is_bestseller && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Bestseller</Badge>}
                          {product.is_trending && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Trending</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/product/${product.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => navigatePage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => navigatePage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone. All images, variants, and collection links will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
