import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";
import { asStock } from "@/lib/product-inventory";
import { bulkProductPatch, type BulkProduct } from "@/lib/product-bulk";
import { publishProductDiscovery } from "@/lib/product-discovery";
import { recordAdminActivity } from "@/lib/admin-activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "products:stock", limit: 90 });
  if (blocked) return blocked;
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Stock invalide." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const quantity = asStock(input.quantity);
  if (input.operation !== "add" || quantity === null || quantity < 1 || [input.color,input.size].some(value => value !== undefined && typeof value !== "string")) return NextResponse.json({ error: "Quantit? ou variante invalide." }, { status: 400 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: current, error: readError } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (readError || !current) return NextResponse.json({ error: readError ? "Lecture du stock impossible." : "Produit introuvable." }, { status: readError ? 503 : 404 });
  let patch;
  try { patch = bulkProductPatch(current as BulkProduct, { ids:[id], action:"stock", confirmation:"stock:1", value:quantity, color:typeof input.color === "string" ? input.color.trim() : undefined, size:typeof input.size === "string" ? input.size.trim() : undefined }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Stock invalide." }, { status: 400 }); }
  const { data, error } = await db.rpc("apply_product_bulk_change", { p_id:id, p_expected:current, p_patch:patch, p_delete:false });
  if (error) return NextResponse.json({ error: "Stock modifi? ailleurs ou service indisponible. Actualisez avant de r?essayer.", code:"INVENTORY_CONFLICT" }, { status: 409 });
  await recordAdminActivity(req, "product", id, data.previous, data.current);
  publishProductDiscovery({previous:data.previous,current:data.current});
  return NextResponse.json({ product:data.current, adjustment:{ operation:"add",quantity,color:input.color??null,size:input.size??null,previous_stock:current.stock,stock:data.current.stock } }, { headers:{"Cache-Control":"no-store"} });
}
