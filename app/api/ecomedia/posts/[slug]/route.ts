import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";
import { hydrateCommunityPost } from "@/lib/ecomedia";
import { verifySessionToken } from "@/lib/admin-session";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ecomedia/posts/[slug]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await sb
    .from("ecomedia_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/ecomedia/posts/[slug] — the author or an authenticated admin can remove a post.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getEcomediaUser(req);
  const adminToken = req.cookies.get("admin_session")?.value;
  const isAdmin = adminToken ? Boolean(await verifySessionToken(adminToken)) : false;

  const { data: post, error: readError } = await sb
    .from("ecomedia_posts")
    .select("id, slug, cta_text, media_url")
    .eq("slug", slug)
    .maybeSingle();
  if (readError || !post) return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });

  const hydrated = hydrateCommunityPost(post as never);
  const isOwner = Boolean(user && hydrated.author_id === user.id);
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Vous ne pouvez pas supprimer cette publication." }, { status: 403 });

  const { error } = await sb.from("ecomedia_posts").delete().eq("id", post.id);
  if (error) return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });

  // Best-effort storage cleanup; database deletion must not fail if the file is already absent.
  if (post.media_url) {
    try {
      const marker = "/storage/v1/object/public/";
      const storedPath = String(post.media_url).split(marker)[1];
      if (storedPath) {
        const [bucket, ...parts] = decodeURIComponent(storedPath).split("/");
        if (["ecomedia", "product-images"].includes(bucket) && parts.length) {
          await sb.storage.from(bucket).remove([parts.join("/")]);
        }
      }
    } catch { /* orphan cleanup can be retried later */ }
  }
  return NextResponse.json({ success: true, id: post.id });
}
