"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Link2, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import type { PublicMenu } from "@/types";

interface MenusTableProps {
  menus: PublicMenu[];
  baseUrl: string;
}

export function MenusTable({ menus, baseUrl }: MenusTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${baseUrl}/store/${slug}`);
    toast.success("Link copied!");
  }

  async function toggleActive(menu: PublicMenu) {
    setLoading(menu.id);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: menu.name, slug: menu.slug, checkout_mode: menu.checkout_mode, is_active: !menu.is_active }),
      });
      if (!(await res.json()).success) throw new Error();
      toast.success(`Menu ${!menu.is_active ? "activated" : "deactivated"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(null);
    }
  }

  if (menus.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="No public menus yet"
        description="Create a shareable menu link and share it on WhatsApp or direct."
        action={<Link href="/admin/menus/new"><Button className="bg-brand hover:bg-brand-dark text-white">New Menu</Button></Link>}
      />
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Menu Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Offer</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menus.map((menu) => {
            const expired = menu.expires_at && new Date(menu.expires_at) < new Date();
            return (
              <TableRow key={menu.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{menu.name}</p>
                    {menu.description && <p className="text-xs text-muted-foreground line-clamp-1">{menu.description}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{menu.slug}</span>
                </TableCell>
                <TableCell><StatusBadge status={menu.checkout_mode} /></TableCell>
                <TableCell>
                  {menu.offer ? (
                    <Badge variant="secondary" className="text-xs">{menu.offer.name}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {expired ? (
                    <span className="text-red-500">Expired</span>
                  ) : menu.expires_at ? (
                    format(new Date(menu.expires_at), "dd MMM yy")
                  ) : "Never"}
                </TableCell>
                <TableCell><StatusBadge status={menu.is_active ? "active" : "inactive"} /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={loading === menu.id}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/menus/${menu.id}`}><Edit className="h-4 w-4 mr-2" /> Edit & Build Sections</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(menu.slug)}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(menu)}>
                        {menu.is_active ? <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</> : <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
