import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/menus/[id]/sections/[sid]/items/[iid]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ iid: string }> }) {
  try {
    const { iid } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const { sort_order, price_override } = body;
    const updates: Record<string, unknown> = {};
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (price_override !== undefined) updates.price_override = price_override;

    const { data, error } = await supabase.from("public_menu_items").update(updates).eq("id", iid).select().single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

// DELETE /api/menus/[id]/sections/[sid]/items/[iid]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ iid: string }> }) {
  try {
    const { iid } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { error } = await supabase.from("public_menu_items").delete().eq("id", iid);
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data: null, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
