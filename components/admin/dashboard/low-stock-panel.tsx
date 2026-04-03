"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageCheck } from "lucide-react";

interface LowStockVariant {
  id: string;
  size: string;
  color: string | null;
  stock_qty: number;
  product_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any;
}

export function LowStockPanel({ variants }: { variants: LowStockVariant[] }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <PackageCheck className="h-8 w-8 mb-2 text-emerald-500" />
            <p className="text-sm">All stocked up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {v.products?.title || "Unknown Product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Size: {v.size}{v.color ? ` • ${v.color}` : ""}
                  </p>
                </div>
                <Badge
                  variant="destructive"
                  className={`ml-3 text-xs shrink-0 ${
                    v.stock_qty === 0
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {v.stock_qty === 0 ? "Out of stock" : `${v.stock_qty} left`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
