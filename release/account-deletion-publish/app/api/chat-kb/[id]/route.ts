import { publicDatabaseError } from "@/lib/public-error";
import { isAdminRequest } from "@/lib/request-auth";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function isAdmin(req: NextRequest) { return isAdminRequest(req); }

/** PUT /api/chat-kb/[id] — update entry */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await readJsonLimited(req);
  const { question, answer, category, language, active, sort_order } = body;
  const { data, error } = await supabase
    .from("chat_knowledge_base")
    .update({
      question: question?.trim(),
      answer: answer?.trim(),
      category: category?.trim() || "general",
      language: language || "all",
      active: active !== false,
      sort_order: sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE /api/chat-kb/[id] — delete entry */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("chat_knowledge_base").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
