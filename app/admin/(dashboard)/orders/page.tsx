import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/shared/page-header";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import type { Metadata } from "next";
import type { Order } from "@/types";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || "1");
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const status = params.status || "";
  const search = params.search || "";

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, total, order_status, payment_method, payment_status, source_channel, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("order_status", status);
  if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={`${count ?? 0} total orders`}
        actions={
          <Link href="/admin/orders/new">
            <Button className="bg-brand hover:bg-brand-dark text-white gap-2">
              <Plus className="h-4 w-4" /> Manual Order
            </Button>
          </Link>
        }
      />
      <OrdersTable
        orders={(orders as unknown as Order[]) || []}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
