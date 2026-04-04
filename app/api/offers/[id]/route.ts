import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { offerSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: offer, error } = await supabase.from("offers").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 404 });

    const { data: scopeData } = await supabase.from("offer_product_scope").select("product_id").eq("offer_id", id);
    const product_ids = (scopeData || []).map((s: { product_id: string }) => s.product_id);

    return NextResponse.json({ data: { ...offer, product_ids }, error: null, success: true });
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
    const parsed = offerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues.map(i => i.message).join(", "), success: false }, { status: 400 });
    }

    const { product_ids, rules, ...offerData } = parsed.data;

    let resolvedRules: Record<string, number> = {};
    switch (offerData.offer_type) {
      case "fixed_price": resolvedRules = { price: rules.price ?? 0 }; break;
      case "percentage": resolvedRules = { pct: rules.pct ?? 0, ...(rules.max_discount ? { max_discount: rules.max_discount } : {}) }; break;
      case "flat": resolvedRules = { amount: rules.amount ?? 0 }; break;
      case "combo_fixed": resolvedRules = { qty: rules.qty ?? 2, price: rules.price ?? 0 }; break;
    }

    const { data: offer, error } = await supabase
      .from("offers")
      .update({ ...offerData, rules: resolvedRules })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });

    // Sync product_set scope: delete all then re-insert
    if (offerData.scope_type === "product_set") {
      await supabase.from("offer_product_scope").delete().eq("offer_id", id);
      if (product_ids.length > 0) {
        const scopeRows = product_ids.map((pid) => ({ offer_id: id, product_id: pid }));
        await supabase.from("offer_product_scope").insert(scopeRows);
      }
    }

    return NextResponse.json({ data: { ...offer, product_ids }, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const { error } = await supabase.from("offers").update({ is_active: false }).eq("id", id);
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data: null, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
