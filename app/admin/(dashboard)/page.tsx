import { createClient } from "@/lib/supabase/server";
import { DashboardStatsCards } from "@/components/admin/dashboard/stats-cards";
import { RecentOrdersTable } from "@/components/admin/dashboard/recent-orders";
import { LowStockPanel } from "@/components/admin/dashboard/low-stock-panel";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch dashboard stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: todayOrders },
    { data: todayRevenueData },
    { count: pendingOrders },
    { count: totalProducts },
    { count: totalCustomers },
    { data: lowStockVariants },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", today.toISOString())
      .neq("order_status", "cancelled"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("order_status", ["placed", "confirmed"]),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("product_variants")
      .select("id, size, color, stock_qty, product_id, products(title)")
      .lt("stock_qty", 5)
      .order("stock_qty", { ascending: true })
      .limit(10),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total, order_status, payment_method, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const todayRevenue = todayRevenueData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

  const stats = {
    todayOrders: todayOrders || 0,
    todayRevenue,
    pendingOrders: pendingOrders || 0,
    lowStockCount: lowStockVariants?.length || 0,
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
  };

  return (
    <div className="space-y-6">
      <DashboardStatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recentOrders || []} />
        </div>
        <div>
          <LowStockPanel variants={lowStockVariants || []} />
        </div>
      </div>
    </div>
  );
}
