import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/ecomedia/comments  { postId, name, email?, content }
export async function POST(req: NextRequest) {
  let body: { postId?: string; name?: string; email?: string; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { postId, name, email, content } = body;

  // Validation
  if (!postId) return NextResponse.json({ error: "postId requis" }, { status: 400 });
  if (!name || name.trim().length < 2) return NextResponse.json({ error: "Prénom trop court (min 2 caractères)" }, { status: 400 });
  if (name.trim().length > 50) return NextResponse.json({ error: "Prénom trop long" }, { status: 400 });
  if (!content || content.trim().length < 2) return NextResponse.json({ error: "Commentaire trop court (min 2 caractères)" }, { status: 400 });
  if (content.trim().length > 500) return NextResponse.json({ error: "Commentaire trop long (max 500 caractères)" }, { status: 400 });
  if (email && email.length > 100) return NextResponse.json({ error: "Email invalide" }, { status: 400 });

  // Verify post exists and is published
  const { data: post } = await sb.from("ecomedia_posts").select("id").eq("id", postId).eq("is_published", true).single();
  if (!post) return NextResponse.json({ error: "Post introuvable" }, { status: 404 });

  // Anti-spam: check if same content+post in last 2 minutes
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: recent } = await sb.from("ecomedia_comments").select("id").eq("post_id", postId).eq("content", content.trim()).gte("created_at", twoMinAgo).maybeSingle();
  if (recent) return NextResponse.json({ error: "Veuillez patienter avant de commenter à nouveau" }, { status: 429 });

  // Sanitize
  const clean = {
    post_id: postId,
    name: name.trim().slice(0, 50),
    email: email?.trim().slice(0, 100) || null,
    content: content.trim().slice(0, 500),
    is_approved: true,
  };

  const { data, error } = await sb.from("ecomedia_comments").insert(clean).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// GET /api/ecomedia/comments?postId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json([]);

  const { data } = await sb
    .from("ecomedia_comments")
    .select("id, name, content, created_at")
    .eq("post_id", postId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}
