"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@/types";

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus() {
    if (status === currentStatus && !note) {
      toast.info("No changes to save");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Order status updated");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold">Update Status</h3>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">New Status</Label>
        <Select value={status} onValueChange={v => { if (v) setStatus(v as OrderStatus); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Note (optional)</Label>
        <Textarea
          placeholder="Internal note for this status change..."
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          className="text-sm resize-none"
        />
      </div>
      <Button className="w-full bg-brand hover:bg-brand-dark text-white" onClick={updateStatus} disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : "Update Status"}
      </Button>
    </div>
  );
}
