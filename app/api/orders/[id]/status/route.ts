import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/orders/[id]/status — status transition
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const { status, note } = body;

    const validStatuses = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ data: null, error: "Invalid status", success: false }, { status: 400 });
    }

    // Get current status
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("order_status")
      .eq("id", id)
      .single();

    if (fetchError) return NextResponse.json({ data: null, error: "Order not found", success: false }, { status: 404 });

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", id);

    if (updateError) return NextResponse.json({ data: null, error: updateError.message, success: false }, { status: 500 });

    // Create status log
    const { data: log, error: logError } = await supabase
      .from("order_status_logs")
      .insert({
        order_id: id,
        from_status: currentOrder.order_status,
        to_status: status,
        note: note || null,
        admin_id: null, // Will add admin lookup later
      })
      .select()
      .single();

    if (logError) console.error("Status log error:", logError);

    return NextResponse.json({ data: { status, log }, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
