import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { generateSlug, hydrateCommunityPost } from "@/lib/ecomedia";
import { notifyPublishedEcomediaPost } from "@/lib/push-notifications";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auth(req: NextRequest) {
  return isAdminRequest(req);
}

// GET /api/admin/ecomedia/posts — list all posts (admin)
export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const { data, error } = await sb
    .from("ecomedia_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json((data ?? []).map(post => {
    const hydrated = hydrateCommunityPost(post);
    return {
      ...hydrated,
      cta_text: post.cta_text,
      moderation_status: hydrated.is_client_post ? (post.is_published ? "approved" : "pending") : undefined,
    };
  }));
}

// POST /api/admin/ecomedia/posts — create post
export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await readJsonLimited(req); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });

  const payload = {
    slug: body.slug ? String(body.slug).trim() : generateSlug(title),
    title,
    content: body.content ? String(body.content).trim() : null,
    type: body.type ?? "text",
    media_url: body.media_url || null,
    thumbnail_url: body.thumbnail_url || null,
    video_url: body.video_url || null,
    product_url: body.product_url || null,
    cta_text: body.cta_text || null,
    is_published: Boolean(body.is_published),
    is_featured: Boolean(body.is_featured),
  };

  const { data, error } = await sb.from("ecomedia_posts").insert(payload).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  let notification = null;
  if (data.is_published) {
    try { notification = await notifyPublishedEcomediaPost(data); }
    catch (error) { console.error("Ecomedia push notification failed:", error); }
  }
  return NextResponse.json({ ...data, notification }, { status: 201 });
}
