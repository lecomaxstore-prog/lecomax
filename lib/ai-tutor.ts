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
/** Anchors are resolved against the sanitized deployment snapshot, never fixed line numbers. */
export const TUTOR_EXAMPLES = [
  { id: "product-card", title: "بطاقة المنتج: Props وState", topic: "react", path: "components/ProductCard.tsx", anchor: "export default function ProductCard", goal: "نفهم كيف تتحول بيانات المنتج إلى بطاقة، وكيف نحسب التخفيض.", challenge: "إذا كان الثمن القديم 200 والجديد 150، توقّع قيمة discount واشرح حسابك." },
  { id: "product-page", title: "صفحة المنتج: من الرابط إلى البيانات", topic: "nextjs", path: "app/produit/[slug]/page.tsx", anchor: "export default async function ProductPage", goal: "نتتبع slug ونفهم لماذا نستخدم async وawait في صفحة الخادم.", challenge: "ابحث عن أول await: ما القيمة التي ينتظرها، ولماذا؟" },
  { id: "filters", title: "فلاتر المتجر: كيف تتغير الواجهة؟", topic: "react", path: "components/CategoryFilters.tsx", anchor: "export default function CategoryFilters", goal: "نربط اختيار المستخدم بـ State ثم نفهم كيف تتغير قائمة المنتجات.", challenge: "حدّد State الخاص بالترتيب وتوقّع ما يحدث عندما تتغير قيمته." },
  { id: "products-api", title: "API المنتجات: Request وResponse", topic: "api", path: "app/api/products/route.ts", anchor: "export async function GET", goal: "نقرأ طلبًا حقيقيًا ونفهم كيف يجهّز الخادم الرد.", challenge: "ابحث عن قيمة يقرأها GET من الطلب، واشرح كيف تؤثر على الرد." },
  { id: "cart", title: "السلة: تطبيق كود التخفيض", topic: "commerce", path: "app/panier/page.tsx", anchor: "async function applyPromo", goal: "نتتبع fetch وحالات الانتظار والنجاح والخطأ في السلة.", challenge: "ماذا يجب أن يرى المستخدم إذا فشل طلب التحقق من الكود؟" },
  { id: "database", title: "Supabase: لماذا الاتصال على الخادم؟", topic: "database", path: "lib/supabase-server.ts", anchor: "export function createServerSupabaseClient", goal: "نفهم إنشاء اتصال قاعدة البيانات وحدود الخادم والمتصفح.", challenge: "اشرح لماذا لا ننقل بيانات الاتصال الخاصة إلى Client Component." },
] as const;
export type TutorExample = typeof TUTOR_EXAMPLES[number];
export function tutorExampleForTopic(topic: TutorTopic): TutorExample {
  return TUTOR_EXAMPLES.find(example => example.topic === topic) ?? TUTOR_EXAMPLES[1];
}
export const TUTOR_ACTIONS = {
  easier: "شرح أبسط", deeper: "شرح أعمق", why: "لماذا؟", remove: "ماذا يحدث إذا حذفته؟",
  line: "اشرح لي هذا السطر", explain: "اشرح الكود", lines: "اشرح سطرًا بسطر", change: "ما الذي يجب أن أغيّره؟", practice: "جرّبني",
  hint: "أعطني تلميحًا واحدًا فقط، بدون الحل", quiz: "اختبر فهمي بسؤال واحد من هذا الشرح وانتظر جوابي", next: "انتقل إلى الخطوة الصغيرة التالية وبيّن كيف أتحقق منها",
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
