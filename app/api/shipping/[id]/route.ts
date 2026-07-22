import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { revalidatePath } from "next/cache";
import { cleanShippingZonePayload } from "@/lib/shipping-zones";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/shipping/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cleaned = cleanShippingZonePayload(body, true);
  if (!cleaned.payload) return NextResponse.json({ error: cleaned.error }, { status: 400 });
  const payload = cleaned.payload;
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });
  const { data, error } = await supabase
    .from("shipping_zones")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/checkout");
  return NextResponse.json(data);
}

// DELETE /api/shipping/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/checkout");
  return NextResponse.json({ success: true });
}
