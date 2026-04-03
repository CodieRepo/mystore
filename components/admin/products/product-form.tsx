"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "@/lib/validations";
import { GENDERS, SIZES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Save, ArrowLeft, Plus, Trash2, Upload, X, GripVertical, ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  product?: any;
  categories: Category[];
  collections: Collection[];
}

export function ProductForm({ product, categories, collections }: Props) {
  const router = useRouter();
  const isEditing = !!product;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const defaultValues: ProductFormData = {
    title: product?.title || "",
    slug: product?.slug || "",
    description: product?.description || "",
    highlights: product?.highlights || [],
    category_id: product?.category_id || null,
    gender: product?.gender || "unisex",
    mrp: product?.mrp || 0,
    sale_price: product?.sale_price || 0,
    sku: product?.sku || "",
    tags: product?.tags || [],
    is_featured: product?.is_featured || false,
    is_bestseller: product?.is_bestseller || false,
    is_trending: product?.is_trending || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_active: product?.is_active ?? true,
    is_draft: product?.is_draft ?? true,
    material: product?.material || "",
    care_instructions: product?.care_instructions || "",
    collection_ids: product?.collection_ids || [],
    variants: product?.variants?.map((v: any) => ({
      id: v.id,
      size: v.size,
      color: v.color || "",
      color_hex: v.color_hex || "",
      stock_qty: v.stock_qty,
      sku_variant: v.sku_variant || "",
    })) || [],
    images: product?.images?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((img: any) => ({
      id: img.id,
      url: img.url,
      alt_text: img.alt_text || "",
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })) || [],
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues,
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });

  const watchTitle = watch("title");
  const watchMrp = watch("mrp");
  const watchSalePrice = watch("sale_price");
  const watchCollectionIds = watch("collection_ids");

  // Auto-generate slug from title
  const generateSlug = useCallback(() => {
    const slug = watchTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setValue("slug", slug);
  }, [watchTitle, setValue]);

  // Calculate discount
  const discountPct = watchMrp > 0 ? Math.round(((watchMrp - watchSalePrice) / watchMrp) * 100) : 0;

  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newImages = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "product-images");

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          newImages.push({
            url: data.data.url,
            alt_text: file.name.split(".")[0],
            sort_order: imageFields.length + newImages.length,
            is_primary: imageFields.length === 0 && newImages.length === 0,
          });
        } else {
          toast.error(`Failed to upload ${file.name}: ${data.error}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    newImages.forEach((img) => appendImage(img));
    setUploading(false);
    e.target.value = "";
  }

  // Set primary image
  function setPrimaryImage(index: number) {
    imageFields.forEach((_, i) => {
      setValue(`images.${i}.is_primary`, i === index);
    });
  }

  // Toggle collection
  function toggleCollection(collectionId: string) {
    const current = watchCollectionIds || [];
    if (current.includes(collectionId)) {
      setValue("collection_ids", current.filter((id) => id !== collectionId));
    } else {
      setValue("collection_ids", [...current, collectionId]);
    }
  }

  // Quick add sizes
  function quickAddSizes() {
    const existingSizes = variantFields.map((v) => v.size);
    SIZES.forEach((size) => {
      if (!existingSizes.includes(size)) {
        appendVariant({ size, color: "", color_hex: "", stock_qty: 0, sku_variant: "" });
      }
    });
  }

  // Handle highlights input
  const [highlightInput, setHighlightInput] = useState("");
  const highlights = watch("highlights") || [];

  function addHighlight() {
    if (highlightInput.trim()) {
      setValue("highlights", [...highlights, highlightInput.trim()]);
      setHighlightInput("");
    }
  }

  function removeHighlight(index: number) {
    setValue("highlights", highlights.filter((_, i) => i !== index));
  }

  // Tags input
  const [tagInput, setTagInput] = useState("");
  const tags = watch("tags") || [];

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(index: number) {
    setValue("tags", tags.filter((_, i) => i !== index));
  }

  // Submit
  async function onSubmit(data: ProductFormData) {
    setSaving(true);
    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(isEditing ? "Product updated!" : "Product created!");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 pb-12">
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
      </Button>

      {/* ============================================ */}
      {/* BASIC INFO */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g. Classic Cotton T-Shirt"
                className="h-10"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input id="slug" {...register("slug")} placeholder="classic-cotton-t-shirt" className="h-10" />
                <Button type="button" variant="outline" size="sm" onClick={generateSlug} className="h-10 px-3 shrink-0 text-xs">
                  Generate
                </Button>
              </div>
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the product..."
              rows={4}
            />
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <Label>Product Highlights</Label>
            <div className="flex gap-2">
              <Input
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                placeholder="e.g. 100% Cotton fabric"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addHighlight(); }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="h-9">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {h}
                    <button type="button" onClick={() => removeHighlight(i)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* CATEGORIZATION */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Categorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch("category_id") || "none"}
                onValueChange={(v) => setValue("category_id", v === "none" ? null : v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select
                value={watch("gender")}
                onValueChange={(v) => { if (v) setValue("gender", v as "men" | "women" | "unisex"); }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} placeholder="e.g. TS-BLK-001" className="h-10" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. summer, cotton"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-9">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="gap-1 pr-1">
                    {t}
                    <button type="button" onClick={() => removeTag(i)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Collections */}
          <div className="space-y-2">
            <Label>Collections</Label>
            <div className="flex flex-wrap gap-2">
              {collections.map((coll) => {
                const selected = (watchCollectionIds || []).includes(coll.id);
                return (
                  <button
                    key={coll.id}
                    type="button"
                    onClick={() => toggleCollection(coll.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                      selected
                        ? "bg-brand/10 border-brand/30 text-brand"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {coll.name}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹) *</Label>
              <Input id="mrp" type="number" step="1" {...register("mrp")} className="h-10" />
              {errors.mrp && <p className="text-xs text-red-500">{errors.mrp.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price (₹) *</Label>
              <Input id="sale_price" type="number" step="1" {...register("sale_price")} className="h-10" />
              {errors.sale_price && <p className="text-xs text-red-500">{errors.sale_price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted/30 text-sm">
                {discountPct > 0 ? (
                  <span className="text-green-600 font-medium">{discountPct}% OFF</span>
                ) : (
                  <span className="text-muted-foreground">No discount</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* IMAGES */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload area */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl h-32 cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag images here</p>
                <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, WebP — Max 5MB each</p>
              </>
            )}
          </label>

          {/* Image grid */}
          {imageFields.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imageFields.map((field, idx) => (
                <div key={field.id} className="relative group rounded-xl border border-border/50 overflow-hidden bg-muted/20">
                  <div className="aspect-square relative">
                    <Image src={field.url} alt={field.alt_text || ""} fill className="object-cover" sizes="200px" />
                  </div>
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={field.is_primary ? "default" : "secondary"}
                      className="text-xs h-7"
                      onClick={() => setPrimaryImage(idx)}
                    >
                      {field.is_primary ? "★ Primary" : "Set Primary"}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => removeImage(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {field.is_primary && (
                    <Badge className="absolute top-2 left-2 bg-brand text-white text-[9px]">Primary</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* VARIANTS */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">Size & Stock</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={quickAddSizes} className="text-xs h-8 gap-1">
              Quick Add All Sizes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendVariant({ size: "", color: "", color_hex: "", stock_qty: 0, sku_variant: "" })}
              className="text-xs h-8 gap-1"
            >
              <Plus className="h-3 w-3" /> Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variantFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No variants added. Add sizes to track stock.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Size</div>
                <div className="col-span-3">Color</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-3">SKU Variant</div>
                <div className="col-span-1"></div>
              </div>
              {variantFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center rounded-lg bg-muted/20 p-2">
                  <div className="col-span-3">
                    <Select
                      value={watch(`variants.${idx}.size`) || ""}
                      onValueChange={(v) => { if (v) setValue(`variants.${idx}.size`, v); }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        <SelectItem value="Free Size">Free Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      {...register(`variants.${idx}.color`)}
                      placeholder="e.g. Black"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      {...register(`variants.${idx}.stock_qty`)}
                      placeholder="0"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      {...register(`variants.${idx}.sku_variant`)}
                      placeholder="Auto"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => removeVariant(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* MATERIAL & CARE */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Material & Care</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input id="material" {...register("material")} placeholder="e.g. 100% Cotton" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="care_instructions">Care Instructions</Label>
            <Input id="care_instructions" {...register("care_instructions")} placeholder="e.g. Machine wash cold" className="h-10" />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* VISIBILITY & FLAGS */}
      {/* ============================================ */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Visibility & Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "is_featured" as const, label: "Featured" },
              { name: "is_bestseller" as const, label: "Best Seller" },
              { name: "is_trending" as const, label: "Trending" },
              { name: "is_new_arrival" as const, label: "New Arrival" },
            ].map((flag) => (
              <label
                key={flag.name}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                  watch(flag.name)
                    ? "border-brand/30 bg-brand/5"
                    : "border-border/50 hover:bg-muted/30"
                }`}
              >
                <input
                  type="checkbox"
                  {...register(flag.name)}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium">{flag.label}</span>
              </label>
            ))}
          </div>

          <Separator />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!watch("is_draft")}
                onChange={(e) => setValue("is_draft", !e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium">Published</span>
                <p className="text-xs text-muted-foreground">Visible on the storefront</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("is_active")}
                className="rounded border-border text-brand focus:ring-brand"
              />
              <div>
                <span className="text-sm font-medium">Active</span>
                <p className="text-xs text-muted-foreground">Product can be ordered</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* SAVE BAR */}
      {/* ============================================ */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-lg border-t border-border/50">
        <div className="flex items-center justify-between max-w-4xl">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand-dark text-white gap-2 min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
