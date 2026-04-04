"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { ShoppingCart, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Order } from "@/types";

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

interface OrdersTableProps {
  orders: Order[];
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
}

export function OrdersTable({ orders, totalPages, currentPage, currentStatus, currentSearch }: OrdersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  function applyFilters(params: Record<string, string>) {
    const q = new URLSearchParams({ page: "1", status: currentStatus, search, ...params });
    router.push(`/admin/orders?${q.toString()}`);
  }

  if (orders.length === 0 && !currentSearch && !currentStatus) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders yet"
        description="Orders from your storefront will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyFilters({ search })}
          />
        </div>
        <Select value={currentStatus} onValueChange={v => applyFilters({ status: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders found" description="Try adjusting your filters." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                  <TableCell className="font-mono text-sm font-semibold">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">₹{order.total?.toLocaleString("en-IN")}</TableCell>
                  <TableCell><StatusBadge status={order.payment_status} /></TableCell>
                  <TableCell><StatusBadge status={order.order_status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{order.source_channel || "direct"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.created_at ? format(new Date(order.created_at), "dd MMM, HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1}
              onClick={() => applyFilters({ page: String(currentPage - 1) })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
              onClick={() => applyFilters({ page: String(currentPage + 1) })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
