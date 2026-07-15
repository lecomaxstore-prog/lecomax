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
  if (error) return NextResponse.json([], { status: 200 });
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

  const body = await req.json();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: body.email, name: body.name ?? null, active: true, source: body.source ?? "admin" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
