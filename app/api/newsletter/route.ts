import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Newsletter list failed", error);
    return NextResponse.json({ error: "Impossible de charger les abonnés" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { data: featureSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "enable_newsletter")
    .maybeSingle();
  if (featureSetting?.value === "false") {
    return NextResponse.json({ error: "La newsletter est temporairement désactivée" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.normalize("NFKC").trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  const name = typeof body?.name === "string" && body.name.trim()
    ? body.name.trim().slice(0, 120)
    : null;
  const source = typeof body?.source === "string" && body.source.trim()
    ? body.source.trim().slice(0, 60)
    : "website";

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email, name, active: true, source }, { onConflict: "email" })
    .select()
    .single();
  if (error) {
    console.error("Newsletter signup failed", error);
    return NextResponse.json({ error: "Inscription impossible pour le moment" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
