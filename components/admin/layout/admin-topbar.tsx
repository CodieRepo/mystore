"use client";

import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { ChevronRight } from "lucide-react";

export function AdminTopbar() {
  const pathname = usePathname();

  // Build breadcrumb from current path
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const navItem = ADMIN_NAV_ITEMS.find((item) => item.href === path);
    const label = navItem?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { label, path, isLast: index === segments.length - 1 };
  });

  // Get page title
  const currentNav = ADMIN_NAV_ITEMS.find((item) => {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.href);
  });
  const pageTitle = currentNav?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-6 max-lg:hidden">
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span className={crumb.isLast ? "text-foreground font-medium" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </div>
        {/* Page Title */}
        <h1 className="text-lg font-semibold tracking-tight mt-0.5">{pageTitle}</h1>
      </div>
    </header>
  );
}
