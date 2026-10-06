export const TUTOR_MODES = {
  explain: { label: "اشرح لي مفهومًا", icon: "📘", starter: "اشرح لي useState من الصفر بمثال صغير." },
  code: { label: "علّمني كتابة الكود", icon: "💻", starter: "علّمني إنشاء صفحة منتج، خطوة واحدة كل مرة." },
  debug: { label: "ساعدني في إصلاح خطأ", icon: "🐛", starter: "أريد فهم خطأ قبل إصلاحه. سأرسل رسالة الخطأ والكود." },
  api: { label: "تعلّم ربط API", icon: "🔌", starter: "علّمني ربط API من الصفر. ابدأ بـ Request وResponse." },
  lines: { label: "اشرح هذا الكود", icon: "🧩", starter: "اشرح الكود الذي أرفقته سطرًا بسطر، ثم أعطني فكرة واحدة أتذكرها." },
  project: { label: "اربط الشرح بموقعي", icon: "🛒", starter: "اشرح كيف يعمل الملف المختار داخل L’ÉCOMAX، اعتمادًا على الكود الفعلي." },
  practice: { label: "خلّيني نجرب بنفسي", icon: "🧠", starter: "أعطني تمرينًا صغيرًا في الموضوع الحالي. لا تعطيني الحل حتى أحاول." },
  build: { label: "ابنِ معي خطوة بخطوة", icon: "🚀", starter: "ابنِ معي Product Card. اشرح أول خطوة واتركني أكتبها." },
  review: { label: "راجع الكود ديالي", icon: "🔍", starter: "راجع محاولتي المرفقة: الصحيح، الأخطاء، التحسينات الاختيارية، وما يجب أن أتعلمه." },
  quiz: { label: "اختبر فهمي", icon: "✦", starter: "اسألني سؤالًا صغيرًا عن الموضوع الحالي وانتظر جوابي." },
} as const;
export type TutorMode = keyof typeof TUTOR_MODES;
export const TUTOR_TOPICS = {
  nextjs: "أساسيات Next.js", react: "React وState وProps", typescript: "TypeScript", routing: "Routing",
  api: "APIs وasync/await", database: "Database وSupabase", auth: "Authentication", debugging: "Debugging",
  commerce: "بناء المتجر", deployment: "Deployment",
} as const;
export type TutorTopic = keyof typeof TUTOR_TOPICS;
export const TUTOR_ACTIONS = {
  easier: "شرح أبسط", deeper: "شرح أعمق", why: "لماذا؟", remove: "ماذا يحدث إذا حذفته؟",
  line: "اشرح لي هذا السطر", explain: "اشرح الكود", lines: "اشرح سطرًا بسطر", change: "ما الذي يجب أن أغيّره؟", practice: "جرّبني",
} as const;
export type TutorAction = keyof typeof TUTOR_ACTIONS;
export type TutorSource = { path: string; startLine: number; endLine: number; generatedAt: string };
export type TutorMessage = { id: string; conversation_id: string; role: "user" | "assistant"; content: string; status: "pending" | "complete" | "failed"; bookmarked: boolean; sources: TutorSource[]; created_at: string };
export type TutorConversation = { id: string; title: string; mode: TutorMode; topic: TutorTopic; updated_at: string };
export type TutorProgress = { topic: TutorTopic; confidence: number; difficulty: string; needs_practice: boolean; attempts: number; completed_exercises: number; mistake_note: string; studied_turns: number; last_studied_at: string };
export const isTutorId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isTutorMode = (value: unknown): value is TutorMode => typeof value === "string" && Object.hasOwn(TUTOR_MODES, value);
export const isTutorTopic = (value: unknown): value is TutorTopic => typeof value === "string" && Object.hasOwn(TUTOR_TOPICS, value);
export const TUTOR_ERROR = "تعذر الوصول إلى أستاذ الذكاء الاصطناعي حاليًا. حاول مرة أخرى بعد قليل.";

/** Bounded manual history replay; permanent progress stays in our own database. */
export function tutorHistory(messages: Pick<TutorMessage, "role" | "content" | "status">[]) {
  const result: { role: "user" | "assistant"; content: string }[] = [];
  let remaining = 24000;
  for (const item of [...messages].reverse()) {
    if (item.status !== "complete") continue;
    if (item.content.length > remaining) break;
    result.unshift({ role: item.role, content: item.content });
    remaining -= item.content.length;
    if (result.length >= 12) break;
  }
  return result;
}
