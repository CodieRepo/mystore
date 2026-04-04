"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer } from "@/types";

interface CustomersTableProps {
  customers: Customer[];
  totalPages: number;
  currentPage: number;
  currentSearch: string;
}

export function CustomersTable({ customers, totalPages, currentPage, currentSearch }: CustomersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  function applyFilters(params: Record<string, string>) {
    const q = new URLSearchParams({ page: "1", search, ...params });
    router.push(`/admin/customers?${q.toString()}`);
  }

  if (customers.length === 0 && !currentSearch) {
    return (
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Customers who order through your store appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applyFilters({ search })}
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Try a different search." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell className="font-medium">{customer.name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{customer.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.email || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(customer.tags || []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(customer.created_at), "dd MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => applyFilters({ page: String(currentPage - 1) })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => applyFilters({ page: String(currentPage + 1) })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
