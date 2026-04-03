"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  order_status: string;
  payment_method: string;
  created_at: string;
}

export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  function getStatusBadge(status: string) {
    const match = ORDER_STATUSES.find((s) => s.value === status);
    return match || { label: status, color: "bg-gray-100 text-gray-800" };
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No orders yet. They&apos;ll appear here once customers start ordering.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/50 bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">When</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusBadge = getStatusBadge(order.order_status);
                  return (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{order.customer_name}</td>
                      <td className="px-4 py-3 font-medium">₹{Number(order.total).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-[10px] font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
