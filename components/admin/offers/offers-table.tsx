"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight, Copy, Plus } from "lucide-react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import type { Offer } from "@/types";

const OFFER_TYPE_LABELS: Record<string, string> = {
  fixed_price: "Fixed Price",
  percentage: "% Off",
  flat: "Flat Discount",
  combo_fixed: "Combo Deal",
};

const SCOPE_LABELS: Record<string, string> = {
  all: "Entire Store",
  category: "Category",
  collection: "Collection",
  product_set: "Selected Products",
};

function getOfferRuleSummary(offer: Offer): string {
  const r = offer.rules;
  switch (offer.offer_type) {
    case "fixed_price": return `₹${r.price} each`;
    case "percentage": return `${r.pct}% off${r.max_discount ? ` (max ₹${r.max_discount})` : ""}`;
    case "flat": return `₹${r.amount} off`;
    case "combo_fixed": return `Any ${r.qty} @ ₹${r.price}`;
    default: return "-";
  }
}

function isOfferExpired(offer: Offer): boolean {
  if (!offer.valid_until) return false;
  return new Date(offer.valid_until) < new Date();
}

interface OffersTableProps {
  offers: Offer[];
}

export function OffersTable({ offers }: OffersTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(offer: Offer) {
    setLoading(offer.id);
    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...offer, is_active: !offer.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Offer ${!offer.is_active ? "activated" : "deactivated"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update offer");
    } finally {
      setLoading(null);
    }
  }

  async function deleteOffer(id: string) {
    if (!confirm("Deactivate this offer? It will no longer apply to any orders.")) return;
    setLoading(id);
    try {
      await fetch(`/api/offers/${id}`, { method: "DELETE" });
      toast.success("Offer deactivated");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        title="No offers yet"
        description="Create your first offer to start applying discounts."
        action={
          <Link href="/admin/offers/new">
            <Button className="gap-2 bg-brand hover:bg-brand-dark text-white">
              <Plus className="h-4 w-4" /> Create Offer
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Validity</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => {
            const expired = isOfferExpired(offer);
            return (
              <TableRow key={offer.id} className={expired ? "opacity-60" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{offer.name}</p>
                    {offer.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{offer.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {OFFER_TYPE_LABELS[offer.offer_type] ?? offer.offer_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {getOfferRuleSummary(offer)}
                </TableCell>
                <TableCell className="text-sm">{SCOPE_LABELS[offer.scope_type] ?? offer.scope_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {offer.valid_from ? format(new Date(offer.valid_from), "dd MMM") : "—"} →{" "}
                  {offer.valid_until ? format(new Date(offer.valid_until), "dd MMM yy") : "No expiry"}
                </TableCell>
                <TableCell className="text-sm font-medium">P{offer.priority}</TableCell>
                <TableCell>
                  {expired ? (
                    <StatusBadge status="expired" />
                  ) : (
                    <StatusBadge status={offer.is_active ? "active" : "inactive"} />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={loading === offer.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/offers/${offer.id}`}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(offer)}>
                        {offer.is_active ? (
                          <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
                        ) : (
                          <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteOffer(offer.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Deactivate
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
