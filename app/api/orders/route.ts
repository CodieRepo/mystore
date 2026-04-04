import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SNK-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const status = searchParams.get("status") || "";
    const channel = searchParams.get("channel") || "";
    const search = searchParams.get("search") || "";
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total, order_status, payment_method, payment_status, source_channel, created_at, offer_id, source_menu_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("order_status", status);
    if (channel) query = query.eq("source_channel", channel);
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, total: count || 0, page, per_page: perPage, success: true, error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// POST — Manual order creation by admin
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const {
      customer_name, customer_phone, customer_email,
      shipping_address, payment_method = "COD",
      items, internal_notes, source_channel = "direct",
    } = body;

    if (!customer_name || !customer_phone || !items?.length) {
      return NextResponse.json({ data: null, error: "Missing required fields", success: false }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { unit_price: number; qty: number }) => sum + item.unit_price * item.qty, 0);
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        shipping_address: shipping_address || {},
        subtotal,
        discount_amount: 0,
        delivery_fee: 0,
        total: subtotal,
        payment_method,
        payment_status: "pending",
        order_status: "placed",
        source_channel,
        internal_notes: internal_notes || null,
      })
      .select()
      .single();

    if (orderError) return NextResponse.json({ data: null, error: orderError.message, success: false }, { status: 500 });

    // Insert order items
    const itemRows = items.map((item: {
      product_id?: string; variant_id?: string; product_title: string;
      product_image?: string; size: string; color?: string; qty: number; unit_price: number; mrp: number;
    }) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      product_title: item.product_title,
      product_image: item.product_image || null,
      size: item.size,
      color: item.color || null,
      qty: item.qty,
      unit_price: item.unit_price,
      mrp: item.mrp || item.unit_price,
      subtotal: item.unit_price * item.qty,
    }));
    await supabase.from("order_items").insert(itemRows);

    // Create initial status log
    await supabase.from("order_status_logs").insert({
      order_id: order.id,
      from_status: null,
      to_status: "placed",
      note: "Order created manually by admin",
      admin_id: null,
    });

    return NextResponse.json({ data: order, error: null, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
