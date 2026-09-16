import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { protectAdminMutation } from "@/lib/api-security";
import { parseAdInput } from "@/lib/ad-validation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ads — public endpoint, returns only active + scheduled ads
export async function GET(req: NextRequest) {
  const admin = req.nextUrl.searchParams.get("admin") === "1";
  if (admin && !(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const now = new Date().toISOString();

  let query = supabase.from("ads").select("*").order("sort_order").order("created_at");
  if (!admin) {
    query = query
      .eq("active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ads:create", limit: 20 });
  if (blocked) return blocked;
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseAdInput(body);
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await supabase.from("ads").insert(parsed.value).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
