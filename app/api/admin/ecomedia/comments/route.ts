import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  return !!(token && (await verifySessionToken(token)));
}

// GET /api/admin/ecomedia/comments?postId=xxx
export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  let query = sb.from("ecomedia_comments").select("*").order("created_at", { ascending: false }).limit(100);
  if (postId) query = query.eq("post_id", postId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
