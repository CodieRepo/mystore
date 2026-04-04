import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const [{ data: customer, error }, { data: orders }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("orders")
        .select("id, order_number, total, order_status, payment_method, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 404 });
    return NextResponse.json({ data: { ...customer, orders: orders || [] }, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
