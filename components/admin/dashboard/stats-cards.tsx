"use client";

import type { DashboardStats } from "@/types";
import {
  ShoppingCart, IndianRupee, Clock, AlertTriangle, Package, Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: DashboardStats;
}

const statCards = [
  {
    key: "todayOrders" as const,
    label: "Today's Orders",
    icon: ShoppingCart,
    format: (v: number) => v.toString(),
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-500",
  },
  {
    key: "todayRevenue" as const,
    label: "Today's Revenue",
    icon: IndianRupee,
    format: (v: number) => `₹${v.toLocaleString("en-IN")}`,
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconColor: "text-emerald-500",
  },
  {
    key: "pendingOrders" as const,
    label: "Pending Orders",
    icon: Clock,
    format: (v: number) => v.toString(),
    gradient: "from-amber-500/10 to-amber-600/5",
    iconColor: "text-amber-500",
  },
  {
    key: "lowStockCount" as const,
    label: "Low Stock Items",
    icon: AlertTriangle,
    format: (v: number) => v.toString(),
    gradient: "from-red-500/10 to-red-600/5",
    iconColor: "text-red-500",
  },
  {
    key: "totalProducts" as const,
    label: "Active Products",
    icon: Package,
    format: (v: number) => v.toString(),
    gradient: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-500",
  },
  {
    key: "totalCustomers" as const,
    label: "Total Customers",
    icon: Users,
    format: (v: number) => v.toString(),
    gradient: "from-pink-500/10 to-pink-600/5",
    iconColor: "text-pink-500",
  },
];

export function DashboardStatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <Card key={card.key} className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 ${card.iconColor}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{card.format(value)}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
