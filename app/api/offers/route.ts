import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { offerSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("offers")
      .select("*", { count: "exact" })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });

    // For each offer with product_set scope, fetch product_ids
    const offersWithProductIds = await Promise.all(
      (data || []).map(async (offer) => {
        if (offer.scope_type === "product_set") {
          const { data: scopeData } = await supabase
            .from("offer_product_scope")
            .select("product_id")
            .eq("offer_id", offer.id);
          return { ...offer, product_ids: (scopeData || []).map((s: { product_id: string }) => s.product_id) };
        }
        return { ...offer, product_ids: [] };
      })
    );

    return NextResponse.json({ data: offersWithProductIds, total: count || 0, success: true, error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", success: false }, { status: 401 });

    const body = await request.json();
    const parsed = offerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues.map(i => i.message).join(", "), success: false }, { status: 400 });
    }

    const { product_ids, rules, ...offerData } = parsed.data;

    // Build rules JSONB from form data based on offer_type
    let resolvedRules: Record<string, number> = {};
    switch (offerData.offer_type) {
      case "fixed_price": resolvedRules = { price: rules.price ?? 0 }; break;
      case "percentage": resolvedRules = { pct: rules.pct ?? 0, ...(rules.max_discount ? { max_discount: rules.max_discount } : {}) }; break;
      case "flat": resolvedRules = { amount: rules.amount ?? 0 }; break;
      case "combo_fixed": resolvedRules = { qty: rules.qty ?? 2, price: rules.price ?? 0 }; break;
    }

    const { data: offer, error } = await supabase
      .from("offers")
      .insert({ ...offerData, rules: resolvedRules })
      .select()
      .single();

    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });

    // Insert product_set scope if applicable
    if (offerData.scope_type === "product_set" && product_ids.length > 0) {
      const scopeRows = product_ids.map((pid) => ({ offer_id: offer.id, product_id: pid }));
      await supabase.from("offer_product_scope").insert(scopeRows);
    }

    return NextResponse.json({ data: { ...offer, product_ids }, error: null, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
