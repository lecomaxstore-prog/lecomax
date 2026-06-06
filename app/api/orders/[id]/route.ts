import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/orders/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/orders/[id]  — update status, tracking_number, etc.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Fetch previous status so we only award points on the transition to delivered
  const { data: prev } = await supabase
    .from("orders")
    .select("status, customer")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("orders")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award 50 EcoClub points when order transitions to "delivered" for the first time
  if (body.status === "delivered" && prev?.status !== "delivered") {
    const email = (prev?.customer as { email?: string })?.email;
    if (email) {
      supabase
        .from("user_points")
        .select("points")
        .eq("email", email)
        .single()
        .then(({ data: existing }) => {
          const newPoints = (existing?.points ?? 0) + 50;
          supabase
            .from("user_points")
            .upsert({ email, points: newPoints, updated_at: new Date().toISOString() }, { onConflict: "email" })
            .then(() => {});
        });
    }
  }

  return NextResponse.json(data);
}

// DELETE /api/orders/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
