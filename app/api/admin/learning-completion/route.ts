import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { protectAdminMutation } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { parisLearningDay } from "@/lib/learning-reminder-time";

export async function POST(req: NextRequest) {
  const denied = await protectAdminMutation(req, { key: "learning-completion" }) || await protectSourceBrowser(req);
  if (denied) return denied;
  const access = (await getAdminAccess(req))!;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await db.from("owner_learning_days").upsert({
    owner_email: access.email, learning_date: parisLearningDay().date, completed_at: new Date().toISOString(),
  }, { onConflict: "owner_email,learning_date" });
  return error
    ? NextResponse.json({ error: "Impossible d’enregistrer la leçon. Réessayez." }, { status: 503 })
    : NextResponse.json({ ok: true });
}
