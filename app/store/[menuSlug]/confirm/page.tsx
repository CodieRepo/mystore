import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ menuSlug: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { menuSlug } = await params;
  const { order } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Placed! 🎉</h1>
        {order && (
          <p className="text-muted-foreground mb-2">
            Your order number is <span className="font-mono font-bold text-foreground">{order}</span>
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-8">
          We&apos;ve received your order and will confirm it shortly. You&apos;ll receive updates on the phone number you provided.
        </p>
        <div className="flex flex-col gap-3">
          <Link href={`/store/${menuSlug}`}>
            <Button variant="outline" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
