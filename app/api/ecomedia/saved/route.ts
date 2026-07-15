import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  let body: { postId?: string; action?: "save" | "unsave" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }
  if (!body.postId || !["save", "unsave"].includes(body.action ?? "")) return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  if (body.action === "save") {
    const { error } = await sb.from("ecomedia_saved").upsert({ post_id: body.postId, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
    return NextResponse.json({ saved: true });
  }
  await sb.from("ecomedia_saved").delete().eq("post_id", body.postId).eq("user_id", user.id);
  return NextResponse.json({ saved: false });
}

export async function GET(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const postId = new URL(req.url).searchParams.get("postId");
  if (postId) {
    const { data } = await sb.from("ecomedia_saved").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
    return NextResponse.json({ saved: !!data });
  }
  const { data, error } = await sb.from("ecomedia_saved").select("post_id, created_at, ecomedia_posts(id, title, content, slug, type, media_url, likes_count, comments_count, created_at)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Publications indisponibles" }, { status: 500 });
  return NextResponse.json({ posts: (data ?? []).map((row: { ecomedia_posts: unknown }) => row.ecomedia_posts).filter(Boolean) });
}
