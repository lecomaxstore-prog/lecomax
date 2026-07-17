import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const REPLY_PREFIX = /^\[\[reply:([0-9a-f-]{36})\]\]/i;

async function ownedComment(req: NextRequest, id: string) {
  const user = await getEcomediaUser(req);
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return { response: NextResponse.json({ error: "Connectez-vous pour gérer ce commentaire." }, { status: 401 }) };

  const { data, error } = await sb
    .from("ecomedia_comments")
    .select("id, post_id, name, email, content, is_approved, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return { response: NextResponse.json({ error: "Commentaire indisponible." }, { status: 500 }) };
  if (!data) return { response: NextResponse.json({ error: "Commentaire introuvable." }, { status: 404 }) };
  if (data.email?.trim().toLowerCase() !== email) {
    return { response: NextResponse.json({ error: "Vous ne pouvez gérer que vos propres commentaires." }, { status: 403 }) };
  }
  return { comment: data };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ownedComment(req, id);
  if (result.response) return result.response;

  let body: { content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
  const content = body.content?.trim() ?? "";
  if (content.length < 2) return NextResponse.json({ error: "Écrivez au moins 2 caractères." }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Votre commentaire ne peut pas dépasser 500 caractères." }, { status: 400 });
  if (result.comment!.content.replace(REPLY_PREFIX, "") === "[[deleted]]") {
    return NextResponse.json({ error: "Un commentaire supprimé ne peut pas être modifié." }, { status: 409 });
  }

  const prefix = result.comment!.content.match(REPLY_PREFIX)?.[0] ?? "";
  const safeContent = /^\[\[(?:reply:|deleted\]\])/i.test(content) ? `\u200B${content}` : content;
  const { data, error } = await sb
    .from("ecomedia_comments")
    .update({ content: `${prefix}${safeContent}` })
    .eq("id", id)
    .eq("email", result.comment!.email)
    .select("id, post_id, name, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Impossible de modifier ce commentaire." }, { status: 500 });
  return NextResponse.json({
    ...data,
    content,
    parent_id: prefix ? prefix.match(REPLY_PREFIX)?.[1] ?? null : null,
    is_owner: true,
    is_deleted: false,
    edited_at: new Date().toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ownedComment(req, id);
  if (result.response) return result.response;

  const { count, error: childError } = await sb
    .from("ecomedia_comments")
    .select("id", { count: "exact", head: true })
    .like("content", `[[reply:${id}]]%`);
  if (childError) return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });

  if ((count ?? 0) > 0) {
    const prefix = result.comment!.content.match(REPLY_PREFIX)?.[0] ?? "";
    const { error } = await sb
      .from("ecomedia_comments")
      .update({ name: "Membre", email: null, content: `${prefix}[[deleted]]` })
      .eq("id", id)
      .eq("email", result.comment!.email);
    if (error) return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
    return NextResponse.json({
      success: true,
      hardDeleted: false,
      countDelta: 0,
      comment: {
        id,
        post_id: result.comment!.post_id,
        name: "Membre",
        content: "Ce commentaire a été supprimé par son auteur.",
        created_at: result.comment!.created_at,
        parent_id: prefix ? prefix.match(REPLY_PREFIX)?.[1] ?? null : null,
        is_owner: false,
        is_deleted: true,
      },
    });
  }

  const { error } = await sb
    .from("ecomedia_comments")
    .delete()
    .eq("id", id)
    .eq("email", result.comment!.email);
  if (error) return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  return NextResponse.json({ success: true, hardDeleted: true, countDelta: -1 });
}
