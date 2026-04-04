import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collectionSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collections")
      .select("*, campaign:campaigns(id, name)")
      .eq("id", id)
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
    const parsed = collectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues.map(i => i.message).join(", "), success: false }, { status: 400 });
    }

    const { data, error } = await supabase.from("collections").update(parsed.data).eq("id", id).select().single();
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data, error: null, success: true });
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

    const { error } = await supabase.from("collections").update({ is_active: false }).eq("id", id);
    if (error) return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 });
    return NextResponse.json({ data: null, error: null, success: true });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", success: false }, { status: 500 });
  }
}
