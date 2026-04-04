import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*),
        status_logs:order_status_logs(* )
      `)
      .eq("id", id)
      .order("created_at", { referencedTable: "order_status_logs", ascending: false })
      .single();

    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 404 });
    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const { internal_notes, payment_status, payment_method } = body;

    const updates: Record<string, unknown> = {};
    if (internal_notes !== undefined) updates.internal_notes = internal_notes;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (payment_method !== undefined) updates.payment_method = payment_method;

    const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
