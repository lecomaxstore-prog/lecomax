import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";
import { protectAdminMutation } from "@/lib/api-security";
import { deliverMobileCampaign } from "@/lib/mobile-campaigns";

type Context = { params: Promise<{ id: string }> };
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function actor(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  return token ? await verifySessionToken(token) : null;
}

export async function PATCH(req: NextRequest, context: Context) {
  const blocked = await protectAdminMutation(req, { key: "mobile-campaigns:action", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;
  const adminEmail = await actor(req);
  if (!adminEmail) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json().catch(() => null) as { action?: unknown } | null;
  const action = body?.action;
  if (action === "send") {
    try {
      return NextResponse.json({ result: await deliverMobileCampaign(id, adminEmail) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l’envoi.";
      return NextResponse.json({ error: message }, { status: message === "CAMPAIGN_NOT_SENDABLE" ? 409 : 502 });
    }
  }
  if (action === "cancel") {
    const { data, error } = await supabase.from("mobile_notification_campaigns")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id).in("status", ["draft", "scheduled"]).select("*").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Cette campagne ne peut plus être annulée." }, { status: 409 });
    await supabase.from("mobile_control_audit").insert({ actor_email: adminEmail, action: "campaign_cancelled", entity_type: "mobile_notification_campaign", entity_id: id });
    return NextResponse.json({ campaign: data });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
