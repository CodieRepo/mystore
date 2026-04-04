import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { CustomersTable } from "@/components/admin/customers/customers-table";
import type { Metadata } from "next";
import type { Customer } from "@/types";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
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
  const search = params.search || "";

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data: customers, count } = await query;
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${count ?? 0} total customers`} />
      <CustomersTable
        customers={(customers as Customer[]) || []}
        totalPages={totalPages}
        currentPage={page}
        currentSearch={search}
      />
    </div>
  );
}
