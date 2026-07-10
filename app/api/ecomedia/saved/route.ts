import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/ecomedia/saved  { postId, userId, action: "save"|"unsave" }
export async function POST(req: NextRequest) {
  let body: { postId?: string; userId?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { postId, userId, action } = body;
  if (!postId || !userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (userId.length > 100) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

  const { data: post } = await sb.from("ecomedia_posts").select("id").eq("id", postId).eq("is_published", true).single();
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (action === "save") {
    const { error } = await sb.from("ecomedia_saved").upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: true });
  } else if (action === "unsave") {
    await sb.from("ecomedia_saved").delete().eq("post_id", postId).eq("user_id", userId);
    return NextResponse.json({ saved: false });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/ecomedia/saved?userId=xxx  → list saved posts with full post data
// GET /api/ecomedia/saved?postId=xxx&userId=xxx  → check single post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const postId = searchParams.get("postId");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (userId.length > 100) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

  // Single-post check
  if (postId) {
    const { data } = await sb.from("ecomedia_saved").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
    return NextResponse.json({ saved: !!data });
  }

  // Full list for dashboard
  const { data, error } = await sb
    .from("ecomedia_saved")
    .select("post_id, created_at, ecomedia_posts(id, title, content, slug, type, image_url, likes_count, comments_count, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const posts = (data ?? []).map((r: { ecomedia_posts: unknown }) => r.ecomedia_posts).filter(Boolean);
  return NextResponse.json({ posts });
}
