import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { OrderStatusUpdater } from "@/components/admin/orders/order-status-updater";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import type { Order } from "@/types";

export const metadata: Metadata = { title: "Order Detail" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), status_logs:order_status_logs(*)")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  const o = order as unknown as Order;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={`Order ${o.order_number}`}
        description={`Placed ${o.created_at ? format(new Date(o.created_at), "dd MMM yyyy, HH:mm") : ""}`}
        actions={<StatusBadge status={o.order_status} />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Order items + logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">Order Items</h3>
            </div>
            <div className="divide-y">
              {(o.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.product_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.size}{item.color ? ` · ${item.color}` : ""} · Qty: {item.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{item.unit_price?.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">₹{item.subtotal?.toLocaleString("en-IN")} total</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t bg-muted/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{o.subtotal?.toLocaleString("en-IN")}</span>
              </div>
              {o.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{o.discount_amount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base mt-1 pt-1 border-t">
                <span>Total</span>
                <span>₹{o.total?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">Status History</h3>
            </div>
            <div className="divide-y">
              {(o.status_logs || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={log.to_status} />
                    <span className="text-xs text-muted-foreground">
                      {log.created_at ? format(new Date(log.created_at), "dd MMM, HH:mm") : ""}
                    </span>
                  </div>
                  {log.note && <p className="text-xs text-muted-foreground mt-1">{log.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Customer + Actions */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Customer</h3>
            <p className="text-sm font-medium">{o.customer_name}</p>
            <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
            {o.customer_email && <p className="text-sm text-muted-foreground">{o.customer_email}</p>}
            {o.shipping_address && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                {(() => {
                  const addr = o.shipping_address as unknown as Record<string, string>;
                  return (
                    <>
                      <p>{addr.line1}</p>
                      <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Payment</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span>{o.payment_method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={o.payment_status} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Channel</span>
              <span className="capitalize">{o.source_channel}</span>
            </div>
          </div>

          {/* Status Updater */}
          <OrderStatusUpdater orderId={id} currentStatus={o.order_status} />
        </div>
      </div>
    </div>
  );
}
