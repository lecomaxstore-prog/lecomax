import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/abandoned-carts/[id] — mark as reminded
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from("abandoned_carts").update({ reminded: true }).eq("id", id);
  return NextResponse.json({ ok: true });
}
