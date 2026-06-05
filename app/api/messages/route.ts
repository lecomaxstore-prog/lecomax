import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread");
  let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
  if (unread === "true") query = query.eq("read", false);
  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({ name: body.name, email: body.email, subject: body.subject, message: body.message, read: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
