import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const includeInactive = searchParams.get("all") === "true";

    let query = supabase
      .from("categories")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, total: count || 0, success: true, error: null });
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues.map(i => i.message).join(", "), success: false }, { status: 400 });
    }

    const { data, error } = await supabase.from("categories").insert(parsed.data).select().single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
