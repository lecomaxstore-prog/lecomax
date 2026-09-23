"use client";

import { useEffect, useRef, useState } from "react";
import { DAILY_LESSONS, dailyText } from "./course/daily-lessons";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";

type Message = { role: "user" | "assistant"; content: string };

export default function CodingTutor({ lang }: { lang: CourseLanguage }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [replyLanguage, setReplyLanguage] = useState("darija");
  const [lessonId, setLessonId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 25_000);
    const next: Message[] = [...messages, { role: "user", content }];
    setPending(true); setError("");
    try {
      const response = await fetch("/api/admin/learning-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-9), lang, replyLanguage, ...(lessonId ? { lessonId } : {}) }),
        signal: controller.signal, cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 403 ? "UNLOCK_REQUIRED" : response.status === 429 ? "RATE_LIMITED" : data.error);
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("AI_UNAVAILABLE");
      setMessages([...next, { role: "assistant", content: data.reply }]); setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI_UNAVAILABLE");
    } finally { clearTimeout(timer); request.current = null; setPending(false); }
  }

  const errorText = error === "AI_BILLING_REQUIRED"
    ? t("Ajoute des crédits dans la facturation de ton compte OpenAI API, puis réessaie. Ta question est conservée.", "Add credits in your OpenAI API account billing, then retry. Your question is preserved.", "أضف رصيدًا في حساب OpenAI API ثم أعد المحاولة. سؤالك محفوظ.")
    : error === "AI_CONFIGURATION_REQUIRED"
    ? t("La clé OpenAI du serveur doit être configurée ou mise à jour.", "The server OpenAI key needs to be configured or updated.", "يجب إعداد مفتاح OpenAI على الخادم أو تحديثه.")
    : error === "UNLOCK_REQUIRED"
    ? t("Reconnecte-toi et déverrouille cette section avant de réessayer.", "Sign in and unlock this section again before retrying.", "سجّل الدخول وافتح هذا القسم ثم أعد المحاولة.")
    : error === "RATE_LIMITED"
    ? t("Trop de questions en peu de temps. Réessaie dans quelques minutes.", "Too many questions at once. Try again in a few minutes.", "أسئلة كثيرة في وقت قصير. أعد المحاولة بعد دقائق.")
    : t("Le tuteur ne peut pas répondre pour le moment. Réessaie ; ta question est conservée.", "The tutor cannot respond right now. Retry; your question is preserved.", "تعذّر الرد الآن. أعد المحاولة؛ سؤالك محفوظ.");

  return <section dir={lang === "ar" ? "rtl" : "ltr"} className="min-w-0 rounded-3xl border border-emerald-200 bg-white p-5 sm:p-7" aria-labelledby="coding-tutor-title">
    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{t("Apprendre avec OpenAI", "Learn with OpenAI", "تعلّم مع OpenAI")}</p>
    <h2 id="coding-tutor-title" className="mt-2 text-xl font-black">{t("Mon tuteur de code", "My coding tutor", "معلّمي للبرمجة")}</h2>
    <p className="mt-2 text-sm leading-6 text-neutral-600">{t("Pose une question sur ton site, Expo ou une erreur de code. Ton tuteur explique simplement, avec un exemple et un petit exercice.", "Ask about your website, Expo or a coding error. Your tutor explains simply, with an example and a small exercise.", "اسأل عن موقعك أو Expo أو خطأ برمجي. يشرح المعلّم ببساطة مع مثال وتمرين صغير.")}</p>
    <label htmlFor="tutor-language" className="mt-4 block text-sm font-bold">{t("Langue des explications", "Explanation language", "لغة الشرح")}</label>
    <select id="tutor-language" value={replyLanguage} disabled={pending} onChange={e => { setReplyLanguage(e.target.value); setMessages([]); setError(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm">
      <option value="darija">الدارجة المغربية — Darija</option>
      <option value="ar">العربية الفصحى — Arabic</option>
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
    <p dir="rtl" className="mt-3 text-sm leading-7 text-emerald-800">لصق هنا شي كود من الموقع وسولني عليه. نشرحو ليك سطر بسطر، ونتعلّمو Next.js بشوية بشوية.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {["شرح ليا كيفاش Next.js كيبني صفحات الموقع", "شنو الفرق بين Server Component و Client Component؟", "اشرح لي هذا الكود سطرًا بسطر:"].map(question => <button key={question} type="button" disabled={pending} onClick={() => setDraft(question)} dir="rtl" className="rounded-xl border border-emerald-200 px-3 py-2 text-sm disabled:opacity-50">{question}</button>)}
    </div>
    <label htmlFor="tutor-lesson" className="mt-4 block text-sm font-bold">{t("Sujet", "Topic", "الموضوع")}</label>
    <select id="tutor-lesson" value={lessonId} disabled={pending} onChange={e => { setLessonId(e.target.value); setMessages([]); setError(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm">
      <option value="">{t("Une question de code", "A coding question", "سؤال برمجي")}</option>
      {DAILY_LESSONS.map(lesson => <option key={lesson.id} value={lesson.id}>{dailyText(lang, lesson.title)}</option>)}
    </select>
    <div role="log" aria-live="polite" aria-label={t("Conversation avec le tuteur", "Tutor conversation", "محادثة المعلّم")} className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto">
      {messages.map((message, index) => <div key={index} className={`rounded-2xl p-4 ${message.role === "user" ? "bg-neutral-100" : "bg-emerald-50"}`}>
        <p className="mb-2 text-xs font-bold">{message.role === "user" ? t("Moi", "Me", "أنا") : t("Tuteur IA", "AI tutor", "المعلّم الذكي")}</p>
        <div dir={message.role === "user" ? "auto" : replyLanguage === "ar" || replyLanguage === "darija" ? "rtl" : "ltr"} className="space-y-3 text-sm leading-7">
          {message.content.split(/```(?:[\w+-]+)?\n?([\s\S]*?)```/g).map((part, i) => i % 2
            ? <pre key={i} dir="ltr" className="overflow-x-auto rounded-xl bg-neutral-900 p-3 text-left text-neutral-100"><code>{part}</code></pre>
            : <p key={i} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{part}</p>)}
        </div>
      </div>)}
    </div>
    <form onSubmit={send} className="mt-4 space-y-3">
      <label htmlFor="tutor-question" className="block text-sm font-bold">{t("Ma question", "My question", "سؤالي")}</label>
      <textarea id="tutor-question" value={draft} onChange={e => setDraft(e.target.value)} maxLength={4000} rows={4} disabled={pending} required className="w-full rounded-xl border border-neutral-300 p-3 text-sm focus-visible:outline-emerald-600" placeholder={t("Explique-moi useState avec un exemple de ma boutique…", "Explain useState with a shop example…", "اشرح لي useState بمثال من المتجر…")} />
      <p className="text-xs leading-5 text-neutral-500">{t("Ta question, les derniers échanges et la leçon choisie sont envoyés à OpenAI. Aucun fichier n’est partagé automatiquement. Ne colle pas de clé API, de mot de passe ou de données client. L’IA peut se tromper : teste les exemples localement.", "Your question, recent messages and selected lesson are sent to OpenAI. No files are shared automatically. Do not paste API keys, passwords or customer data. AI can make mistakes: test examples locally.", "يُرسل سؤالك وآخر الرسائل والدرس المختار إلى OpenAI. لا تُشارك الملفات تلقائيًا. لا ترسل مفاتيح API أو كلمات مرور أو بيانات العملاء. قد يخطئ الذكاء الاصطناعي؛ اختبر الأمثلة محليًا.")}</p>
      {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{errorText}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={pending || !draft.trim()} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50">{pending ? t("Le tuteur réfléchit…", "Tutor is thinking…", "المعلّم يفكّر…") : t("Demander au tuteur", "Ask the tutor", "اسأل المعلّم")}</button>
        {!!messages.length && <button type="button" disabled={pending} onClick={() => { setMessages([]); setError(""); }} className="min-h-12 rounded-xl border px-4 text-sm font-bold disabled:opacity-50">{t("Nouvelle discussion", "New discussion", "محادثة جديدة")}</button>}
      </div>
    </form>
  </section>;
}
