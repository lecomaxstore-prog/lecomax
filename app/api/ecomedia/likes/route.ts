import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/ecomedia/likes  { postId, visitorId, action: "like"|"unlike" }
export async function POST(req: NextRequest) {
  let body: { postId?: string; visitorId?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { postId, visitorId, action } = body;
  if (!postId || !visitorId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (visitorId.length > 100) return NextResponse.json({ error: "Invalid visitor ID" }, { status: 400 });

  // Verify post exists and is published
  const { data: post } = await sb.from("ecomedia_posts").select("id").eq("id", postId).eq("is_published", true).single();
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (action === "like") {
    const { error } = await sb.from("ecomedia_likes").upsert({ post_id: postId, visitor_id: visitorId }, { onConflict: "post_id,visitor_id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "unlike") {
    await sb.from("ecomedia_likes").delete().eq("post_id", postId).eq("visitor_id", visitorId);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Return updated count
  const { data: updated } = await sb.from("ecomedia_posts").select("likes_count").eq("id", postId).single();
  return NextResponse.json({ likes_count: updated?.likes_count ?? 0 });
}

// GET /api/ecomedia/likes?postId=xxx&visitorId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const visitorId = searchParams.get("visitorId");
  if (!postId || !visitorId) return NextResponse.json({ liked: false });

  const { data } = await sb.from("ecomedia_likes").select("id").eq("post_id", postId).eq("visitor_id", visitorId).maybeSingle();
  return NextResponse.json({ liked: !!data });
}
