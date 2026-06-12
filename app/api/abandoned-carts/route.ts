import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
  Supabase table (run once):

  CREATE TABLE IF NOT EXISTS abandoned_carts (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone       text,
    name        text,
    email       text,
    items       jsonb DEFAULT '[]',
    total       numeric DEFAULT 0,
    reminded    boolean DEFAULT false,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
  );
*/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/abandoned-carts — list all (admin)
export async function GET() {
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/abandoned-carts — upsert cart by phone (from client)
export async function POST(req: NextRequest) {
  let body: { phone?: string; name?: string; email?: string; items?: unknown[]; total?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { phone, name, email, items, total } = body;

  // Need at least phone or email to track
  if (!phone && !email) return NextResponse.json({ ok: false });

  const key = phone || email;
  const column = phone ? "phone" : "email";

  const { error } = await supabase.from("abandoned_carts").upsert(
    {
      [column]: key,
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      items: items ?? [],
      total: total ?? 0,
      reminded: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: column }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/abandoned-carts?id=xxx — remove one
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await supabase.from("abandoned_carts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
