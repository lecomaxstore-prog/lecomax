import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
