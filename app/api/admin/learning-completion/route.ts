import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { protectAdminMutation } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { parisLearningDay } from "@/lib/learning-reminder-time";
import { readJsonLimited } from "@/lib/request-body";
import { DAILY_TEST_VERSION, gradeDailyTest } from "@/app/admin/how-it-was-built/course/daily-tests";

export async function POST(req: NextRequest) {
  const denied = await protectAdminMutation(req, { key: "learning-completion" }) || await protectSourceBrowser(req);
  if (denied) return denied;
  // Existing academy completion calls have no body. Daily tests send their
  // answers, which must pass server-side grading before recording the day.
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = await readJsonLimited(req, 4096).catch(() => null);
    if (body?.kind !== "daily-test" || body.version !== DAILY_TEST_VERSION || typeof body.lessonId !== "string") {
      return NextResponse.json({ error: "Invalid daily test submission." }, { status: 400 });
    }
    const result = gradeDailyTest(body.lessonId, body.answers);
    if (!result) return NextResponse.json({ error: "Invalid daily test answers." }, { status: 400 });
    if (!result.passed) return NextResponse.json({ error: "Daily test not passed.", result }, { status: 422 });
  }
  const access = (await getAdminAccess(req))!;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await db.from("owner_learning_days").upsert({
    owner_email: access.email, learning_date: parisLearningDay().date, completed_at: new Date().toISOString(),
  }, { onConflict: "owner_email,learning_date" });
  return error
    ? NextResponse.json({ error: "Impossible d’enregistrer la leçon. Réessayez." }, { status: 503 })
    : NextResponse.json({ ok: true });
}
