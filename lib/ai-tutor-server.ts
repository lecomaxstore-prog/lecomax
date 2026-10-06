import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "./dev-docs-access";
import { protectAdminMutation, enforceRateLimit } from "./api-security";
import { getAdminAccess } from "./admin-access";
import { createServerSupabaseClient } from "./supabase-server";
import { TUTOR_ERROR } from "./ai-tutor";
export const tutorJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function tutorAccess(req: NextRequest, mutation = false) {
  const denied = await protectSourceBrowser(req) || (mutation ? await protectAdminMutation(req, { key: "ai-tutor", limit: 40 }) : null);
  if (denied) return { denied };
  const access = await getAdminAccess(req);
  if (!access?.owner) return { denied: tutorJson({ error: "افتح مساحة التعلم بحساب المالك." }, 403) };
  const limited = enforceRateLimit(req, "ai-tutor-read", 120, 60_000, access.email);
  if (limited) return { denied: limited };
  return { owner: access.email, db: createServerSupabaseClient(10_000) };
}
export function tutorFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "SENSITIVE_CONTENT") return tutorJson({ error: "يبدو أن النص يحتوي على مفتاح أو بيانات سرية. احذف القيم السرية واستعمل YOUR_API_KEY ثم أعد المحاولة." }, 400);
  if (["INVALID_SOURCE", "SOURCE_UNAVAILABLE"].includes(code)) return tutorJson({ error: "هذا الملف غير متاح للشرح. اختر ملفًا من كود المشروع بدون أسرار." }, 400);
  return tutorJson({ error: TUTOR_ERROR }, 503);
}
