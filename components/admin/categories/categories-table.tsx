"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { CategoryForm } from "./category-form";
import { Tag } from "lucide-react";
import type { Category } from "@/types";

interface CategoriesTableProps {
  categories: Category[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(cat: Category) {
    setLoading(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cat, is_active: !cat.is_active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Category ${!cat.is_active ? "activated" : "deactivated"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update category");
    } finally {
      setLoading(null);
    }
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No categories yet"
        description="Categories help organise your products."
        action={<CategoryForm />}
      />
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
              <TableCell className="text-sm capitalize">{cat.gender}</TableCell>
              <TableCell className="text-sm">{cat.sort_order}</TableCell>
              <TableCell><StatusBadge status={cat.is_active ? "active" : "inactive"} /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <CategoryForm
                    categoryId={cat.id}
                    defaultValues={cat}
                    trigger={
                      <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={loading === cat.id}
                    onClick={() => toggleActive(cat)}
                  >
                    {cat.is_active
                      ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                      : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    }
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
