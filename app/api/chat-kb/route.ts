import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

/** GET /api/chat-kb — list all entries (admin only) */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("chat_knowledge_base")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST /api/chat-kb — create new entry */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { question, answer, category, language, active, sort_order } = body;
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }
  const { data, error } = await supabase.from("chat_knowledge_base").insert({
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || "general",
    language: language || "all",
    active: active !== false,
    sort_order: sort_order ?? 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
