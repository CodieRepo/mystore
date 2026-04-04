import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | Snarky Store", default: "Snarky Store" },
  description: "Shop the latest fashion at Snarky Store",
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
