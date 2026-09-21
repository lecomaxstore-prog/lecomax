import { revalidateTag } from "next/cache";
import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { notifyPublishedEcomediaPost } from "@/lib/push-notifications";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auth(req: NextRequest) {
  return isAdminRequest(req);
}

// GET /api/admin/ecomedia/posts/[id] — single post with comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await sb.from("ecomedia_posts").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/admin/ecomedia/posts/[id] — update post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await readJsonLimited(req); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { data: previous } = await sb
    .from("ecomedia_posts")
    .select("is_published")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await sb
    .from("ecomedia_posts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  revalidateTag("storefront-ecomedia");
  let notification = null;
  if (!previous?.is_published && data.is_published) {
    try { notification = await notifyPublishedEcomediaPost(data); }
    catch (error) { console.error("Ecomedia push notification failed:", error); }
  }
  return NextResponse.json({ ...data, notification });
}

// DELETE /api/admin/ecomedia/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: post } = await sb.from("ecomedia_posts").select("media_url").eq("id", id).maybeSingle();
  const { error } = await sb.from("ecomedia_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  revalidateTag("storefront-ecomedia");
  if (post?.media_url) {
    try {
      const marker = "/storage/v1/object/public/";
      const storedPath = String(post.media_url).split(marker)[1];
      if (storedPath) {
        const [bucket, ...parts] = decodeURIComponent(storedPath).split("/");
        if (["ecomedia", "product-images"].includes(bucket) && parts.length) await sb.storage.from(bucket).remove([parts.join("/")]);
      }
    } catch { /* best-effort cleanup */ }
  }
  return NextResponse.json({ success: true });
}
