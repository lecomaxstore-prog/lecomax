import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";
import { publishOfferNotification } from "@/lib/offer-notification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/promotions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "promotions:update", limit: 30 });
  if (blocked) return blocked;
  const { id } = await params;
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await supabase.from("promotions").update(body as object).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  revalidateTag("storefront-promotions");
  revalidatePath("/", "layout");
  publishOfferNotification(data.id, "promotion");
  return NextResponse.json(data);
}

// DELETE /api/promotions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(_req, { key: "promotions:delete", limit: 30 });
  if (blocked) return blocked;
  const { id } = await params;
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  revalidateTag("storefront-promotions");
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
