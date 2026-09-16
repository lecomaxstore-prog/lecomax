import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  let body: { postId?: string; action?: "like" | "unlike" };
  try { body = await readJsonLimited(req); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }
  if (!body.postId || !["like", "unlike"].includes(body.action ?? "")) return NextResponse.json({ error: "Champs invalides" }, { status: 400 });

  const { data: post } = await sb.from("ecomedia_posts").select("id").eq("id", body.postId).eq("is_published", true).maybeSingle();
  if (!post) return NextResponse.json({ error: "Publication introuvable" }, { status: 404 });
  if (body.action === "like") {
    const { error } = await sb.from("ecomedia_likes").upsert({ post_id: body.postId, visitor_id: user.id }, { onConflict: "post_id,visitor_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "Impossible d'ajouter la réaction" }, { status: 500 });
  } else {
    await sb.from("ecomedia_likes").delete().eq("post_id", body.postId).eq("visitor_id", user.id);
  }
  const { data: updated } = await sb.from("ecomedia_posts").select("likes_count").eq("id", body.postId).single();
  return NextResponse.json({ likes_count: updated?.likes_count ?? 0 });
}

export async function GET(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ liked: false });
  const postId = new URL(req.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ liked: false });
  const { data } = await sb.from("ecomedia_likes").select("id").eq("post_id", postId).eq("visitor_id", user.id).maybeSingle();
  return NextResponse.json({ liked: !!data });
}
