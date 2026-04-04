import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import type { Metadata } from "next";
import type { Order } from "@/types";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer, error }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase.from("orders")
      .select("id, order_number, total, order_status, payment_method, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !customer) notFound();

  const totalSpend = (orders || []).filter(o => o.order_status !== "cancelled" && o.order_status !== "returned")
    .reduce((s: number, o: { total: number }) => s + (o.total || 0), 0);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={customer.name || customer.phone} description={`Customer since ${format(new Date(customer.created_at), "dd MMM yyyy")}`} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold mb-3">Contact</h3>
          <p className="text-sm">{customer.name || "No name"}</p>
          <p className="text-sm text-muted-foreground font-mono">{customer.phone}</p>
          {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{orders?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Spend</span><span className="font-medium">₹{totalSpend.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Repeat</span><span>{customer.is_repeat ? "Yes" : "No"}</span></div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h3 className="text-base font-semibold mb-4">Order History</h3>
        {!orders?.length ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="rounded-lg border border-border divide-y overflow-hidden">
            {(orders as unknown as Order[]).map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : ""}</p>
                </div>
                <StatusBadge status={order.order_status} />
                <p className="text-sm font-semibold min-w-[80px] text-right">₹{order.total?.toLocaleString("en-IN")}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
