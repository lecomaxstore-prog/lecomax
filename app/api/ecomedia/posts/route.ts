import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { communityAvatar, communityDisplayName, getEcomediaUser } from "@/lib/ecomedia-auth";
import { encodeCommunityAuthor, generateSlug, hydrateCommunityPost } from "@/lib/ecomedia";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ecomedia/posts?type=image&limit=12&offset=0&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const search = searchParams.get("search");

  let query = sb
    .from("ecomedia_posts")
    .select("*")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") {
    if (type === "videos") {
      query = query.in("type", ["video_upload", "video_url"]);
    } else if (type === "images") {
      query = query.eq("type", "image");
    } else if (type === "offers") {
      query = query.in("type", ["promotion", "product"]);
    } else {
      query = query.eq("type", type);
    }
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(post => hydrateCommunityPost(post)), {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}

// Authenticated customers can publish a text or image post.
export async function POST(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour publier." }, { status: 401 });
  let body: { content?: string; mediaUrl?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }
  const content = body.content?.trim() ?? "";
  const mediaUrl = body.mediaUrl?.trim() || null;
  if (content.length < 2 && !mediaUrl) return NextResponse.json({ error: "Ajoutez un message ou une photo." }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Votre publication ne peut pas dépasser 2 000 caractères." }, { status: 400 });
  if (mediaUrl) {
    const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
    const isCustomerPhoto = mediaUrl.startsWith(`${storageBase}ecomedia/community/${user.id}/images/`)
      || mediaUrl.startsWith(`${storageBase}product-images/ecomedia/community/${user.id}/images/`);
    if (!isCustomerPhoto || mediaUrl.length > 1000) {
      return NextResponse.json({ error: "Cette photo n'a pas été envoyée depuis votre appareil. Choisissez-la à nouveau." }, { status: 400 });
    }
  }
  const title = (content || "Nouvelle publication de la communauté").slice(0, 100);
  const authorMeta = encodeCommunityAuthor({ id: user.id, name: communityDisplayName(user), avatar: communityAvatar(user) });
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
  const { data: recentPost } = await sb.from("ecomedia_posts").select("id").eq("cta_text", authorMeta).gte("created_at", thirtySecondsAgo).limit(1).maybeSingle();
  if (recentPost) return NextResponse.json({ error: "Patientez quelques secondes avant de publier à nouveau." }, { status: 429 });
  const payload = {
    slug: generateSlug(title),
    title,
    content: content || null,
    type: mediaUrl ? "image" : "text",
    media_url: mediaUrl,
    is_published: true,
    is_featured: false,
    cta_text: authorMeta,
  };
  const { data, error } = await sb.from("ecomedia_posts").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: "Impossible de publier pour le moment." }, { status: 500 });
  return NextResponse.json(hydrateCommunityPost(data), { status: 201 });
}
