"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, MoreHorizontal, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import type { Collection } from "@/types";

interface CollectionsTableProps {
  collections: Collection[];
}

export function CollectionsTable({ collections }: CollectionsTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(col: Collection) {
    setLoading(col.id);
    try {
      const res = await fetch(`/api/collections/${col.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: col.name, slug: col.slug, is_active: !col.is_active, sort_order: col.sort_order }),
      });
      if (!(await res.json()).success) throw new Error();
      toast.success(`Collection ${!col.is_active ? "activated" : "deactivated"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setLoading(null);
    }
  }

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No collections yet"
        description="Collections group products into curated sets."
        action={<Link href="/admin/collections/new"><Button className="bg-brand hover:bg-brand-dark text-white">New Collection</Button></Link>}
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
            <TableHead>Sort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((col) => (
            <TableRow key={col.id}>
              <TableCell className="font-medium">{col.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{col.slug}</TableCell>
              <TableCell className="text-sm">{col.sort_order}</TableCell>
              <TableCell><StatusBadge status={col.is_active ? "active" : "inactive"} /></TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" disabled={loading === col.id}><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/admin/collections/${col.id}`}><Edit className="h-4 w-4 mr-2" /> Edit & Manage Products</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(col)}>
                      {col.is_active ? <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</> : <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
