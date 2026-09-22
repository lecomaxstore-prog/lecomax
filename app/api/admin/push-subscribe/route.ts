import { publicDatabaseError } from "@/lib/public-error";
import { validPushEndpoint } from "@/lib/push-endpoint";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { getAdminAccess } from "@/lib/admin-access";
import { ADMIN_PUSH_USER_AGENT_PREFIX } from "@/lib/push-notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SubscriptionBody = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function POST(req: NextRequest) {
  const access = await getAdminAccess(req);
  if (!access) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await readJsonLimited(req).catch(() => null) as SubscriptionBody | null;
  if (!validPushEndpoint(body?.endpoint) || !body?.keys?.p256dh || !body.keys.auth) {
    return NextResponse.json({ error: "Abonnement incomplet" }, { status: 400 });
  }

  const userAgent = `${ADMIN_PUSH_USER_AGENT_PREFIX}${req.headers.get("user-agent") ?? "appareil admin"}`;
  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    user_agent: userAgent,
    admin_email: access.email,
  }, { onConflict: "endpoint" });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await readJsonLimited(req).catch(() => null) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "Endpoint requis" }, { status: 400 });
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
