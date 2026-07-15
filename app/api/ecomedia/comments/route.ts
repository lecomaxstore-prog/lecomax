import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { communityDisplayName, getEcomediaUser } from "@/lib/ecomedia-auth";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour participer à la discussion." }, { status: 401 });

  let body: { postId?: string; content?: string; parentId?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }
  const postId = body.postId?.trim();
  const content = body.content?.trim();
  const parentId = body.parentId?.trim() || null;
  if (!postId) return NextResponse.json({ error: "Publication requise" }, { status: 400 });
  if (!content || content.length < 2) return NextResponse.json({ error: "Votre message est trop court." }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Votre message ne peut pas dépasser 500 caractères." }, { status: 400 });

  const { data: post } = await sb.from("ecomedia_posts").select("id").eq("id", postId).eq("is_published", true).maybeSingle();
  if (!post) return NextResponse.json({ error: "Publication introuvable" }, { status: 404 });
  if (parentId) {
    const { data: parent } = await sb.from("ecomedia_comments").select("id").eq("id", parentId).eq("post_id", postId).eq("is_approved", true).maybeSingle();
    if (!parent) return NextResponse.json({ error: "Commentaire parent introuvable" }, { status: 404 });
  }

  const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();
  const safeContent = !parentId && /^\[\[reply:/i.test(content) ? `\u200B${content}` : content;
  const storedContent = parentId ? `[[reply:${parentId}]]${content}` : safeContent;
  const { data: recent } = await sb.from("ecomedia_comments").select("id").eq("post_id", postId).eq("email", user.email ?? "").eq("content", storedContent).gte("created_at", twoMinutesAgo).maybeSingle();
  if (recent) return NextResponse.json({ error: "Ce message a déjà été envoyé." }, { status: 429 });

  const payload = {
    post_id: postId,
    name: communityDisplayName(user),
    email: user.email ?? null,
    content: storedContent,
    is_approved: true,
  };
  const { data, error } = await sb.from("ecomedia_comments").insert(payload).select("id, post_id, name, content, is_approved, created_at").single();
  if (error) return NextResponse.json({ error: "Impossible de publier votre message." }, { status: 500 });
  return NextResponse.json({ ...data, parent_id: parentId, content }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const postId = new URL(req.url).searchParams.get("postId");
  if (!postId) return NextResponse.json([]);
  const { data, error } = await sb
    .from("ecomedia_comments")
    .select("id, post_id, name, content, created_at")
    .eq("post_id", postId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: "Commentaires indisponibles" }, { status: 500 });
  const comments = (data ?? []).map(comment => {
    const match = comment.content.match(/^\[\[reply:([0-9a-f-]{36})\]\]([\s\S]*)$/i);
    return match ? { ...comment, parent_id: match[1], content: match[2] } : { ...comment, parent_id: null };
  });
  return NextResponse.json(comments, { headers: { "Cache-Control": "no-store" } });
}
