import { NextRequest } from "next/server";
import { tutorAccess, tutorJson, tutorFailure } from "@/lib/ai-tutor-server";
import { isTutorId, isTutorMode, isTutorTopic } from "@/lib/ai-tutor";
import { assertTutorContentSafe } from "@/lib/ai-tutor-security";
import { readJsonLimited } from "@/lib/request-body";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const access = await tutorAccess(req);
    if (access.denied) return access.denied;
    const { db, owner } = access;
    const id = req.nextUrl.searchParams.get("conversation");
    if (id) {
      if (!isTutorId(id)) return tutorJson({ error: "طلب غير صالح." }, 400);
      const conversation = await db!.from("ai_learning_conversations").select("id,title,mode,topic,updated_at").eq("owner_email", owner!).eq("id", id).maybeSingle();
      if (conversation.error) throw conversation.error;
      if (!conversation.data) return tutorJson({ error: "الجلسة غير موجودة." }, 404);
      const messages = await db!.from("ai_learning_messages").select("id,conversation_id,role,content,status,bookmarked,sources,created_at").eq("owner_email", owner!).eq("conversation_id", id).order("created_at").limit(202);
      if (messages.error) throw messages.error;
      return tutorJson({ conversation: conversation.data, messages: messages.data });
    }
    const [conversations, progress, bookmarks] = await Promise.all([
      db!.from("ai_learning_conversations").select("id,title,mode,topic,updated_at").eq("owner_email", owner!).order("updated_at", { ascending: false }).limit(100),
      db!.from("ai_learning_progress").select("topic,confidence,difficulty,needs_practice,attempts,completed_exercises,mistake_note,studied_turns,last_studied_at").eq("owner_email", owner!).order("last_studied_at", { ascending: false }),
      db!.from("ai_learning_messages").select("id,conversation_id,role,content,status,bookmarked,sources,created_at").eq("owner_email", owner!).eq("bookmarked", true).eq("role", "assistant").eq("status", "complete").order("created_at", { ascending: false }).limit(100),
    ]);
    if ([conversations, progress, bookmarks].some(result => result.error)) throw new Error("STORAGE_UNAVAILABLE");
    return tutorJson({ conversations: conversations.data, progress: progress.data, bookmarks: bookmarks.data, configured: Boolean(process.env.OPENAI_API_KEY?.trim()) });
  } catch (error) { return tutorFailure(error); }
}
export async function POST(req: NextRequest) {
  try {
    const access = await tutorAccess(req, true);
    if (access.denied) return access.denied;
    const body = await readJsonLimited(req, 2048).catch(() => null);
    if (!body || !isTutorMode(body.mode) || !isTutorTopic(body.topic) || typeof body.title !== "string" || !body.title.trim() || body.title.length > 120) return tutorJson({ error: "طلب غير صالح." }, 400);
    assertTutorContentSafe(body.title);
    const result = await access.db!.from("ai_learning_conversations").insert({ owner_email: access.owner, title: body.title.trim(), mode: body.mode, topic: body.topic }).select("id,title,mode,topic,updated_at").single();
    if (result.error) throw result.error;
    return tutorJson({ conversation: result.data }, 201);
  } catch (error) { return tutorFailure(error); }
}
export async function PATCH(req: NextRequest) {
  try {
    const access = await tutorAccess(req, true);
    if (access.denied) return access.denied;
    const body = await readJsonLimited(req, 4096).catch(() => null);
    if (body?.action === "bookmark" && isTutorId(body.messageId) && typeof body.value === "boolean") {
      const result = await access.db!.from("ai_learning_messages").update({ bookmarked: body.value }).eq("owner_email", access.owner!).eq("id", body.messageId).eq("role", "assistant").eq("status", "complete").select("id");
      if (result.error) throw result.error;
      return result.data?.length ? tutorJson({ ok: true }) : tutorJson({ error: "الشرح غير موجود." }, 404);
    }
    if (body?.action === "progress" && isTutorTopic(body.topic) && [0,25,50,75,100].includes(body.confidence) &&
      ["beginner","comfortable","advanced"].includes(body.difficulty) && typeof body.needsPractice === "boolean" &&
      typeof body.mistakeNote === "string" && body.mistakeNote.length <= 1000 && Number.isInteger(body.completedExercises) && body.completedExercises >= 0 && body.completedExercises <= 1000) {
      assertTutorContentSafe(body.mistakeNote);
      const result = await access.db!.from("ai_learning_progress").upsert({ owner_email: access.owner, topic: body.topic, confidence: body.confidence, difficulty: body.difficulty, needs_practice: body.needsPractice, mistake_note: body.mistakeNote, completed_exercises: body.completedExercises, completed_at: body.confidence === 100 ? new Date().toISOString() : null }, { onConflict: "owner_email,topic" });
      if (result.error) throw result.error;
      return tutorJson({ ok: true });
    }
    return tutorJson({ error: "طلب غير صالح." }, 400);
  } catch (error) { return tutorFailure(error); }
}
