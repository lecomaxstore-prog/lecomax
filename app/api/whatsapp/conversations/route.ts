import { publicDatabaseError } from "@/lib/public-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** GET /api/whatsapp/conversations — list all conversations */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .order("last_at", { ascending: false });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data || []);
}
