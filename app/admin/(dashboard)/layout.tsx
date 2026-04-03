import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { AdminTopbar } from "@/components/admin/layout/admin-topbar";

export const metadata: Metadata = {
  title: {
    template: "%s | Snarky Store Admin",
    default: "Dashboard | Snarky Store Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden max-lg:pt-14">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="admin-container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
