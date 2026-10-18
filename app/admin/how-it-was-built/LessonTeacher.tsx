"use client";
import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CourseLanguage } from "./course/types";
import { text, type Text } from "./learning/types";
import styles from "./LessonTeacher.module.css";

type Props = { lang: CourseLanguage; topic: string; context?: string; sourcePath?: string; sourceLine?: number; sourceAnchor?: string };
type Source = { path: string; startLine: number; endLine: number };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };
const prompts: { label: Text; question: Text; mode: "explain" | "practice" | "debug" }[] = [
  { label: ["Plus simple", "Simpler", "شرح أبسط"], question: ["Explique cette idée avec des mots très simples et une comparaison avec ma boutique. Une idée à la fois.", "Explain this idea in very simple words with an analogy from my shop. One idea at a time.", "شرح ليا هاد الفكرة بكلمات بسيطة وبمثال من المتجر ديالي، فكرة بفكرة."], mode: "explain" },
  { label: ["Un exemple", "An example", "مثال"], question: ["Donne un petit exemple lié à cette leçon et explique le résultat attendu. Distingue mon vrai code d’un exemple inventé.", "Give a small example related to this lesson and explain the expected result. Distinguish my actual code from an illustrative example.", "عطيني مثال صغير متعلق بهاد الدرس وشرح النتيجة المتوقعة. فرّق بين الكود الحقيقي ديالي والمثال التوضيحي."], mode: "explain" },
  { label: ["Un indice", "A hint", "تلميح"], question: ["Donne-moi un petit exercice sur cette idée et un indice, sans révéler la solution. Attends mon essai.", "Give me a small exercise on this idea and a hint without revealing the solution. Wait for my attempt.", "عطيني تمرين صغير على هاد الفكرة وتلميح بلا الحل. تسنّى المحاولة ديالي."], mode: "practice" },
  { label: ["Une erreur", "An error", "خطأ"], question: ["Aide-moi à comprendre une erreur dans cette partie. Demande d’abord le message exact et ce que j’attendais, sans clés ni données privées.", "Help me understand an error in this part. First ask for the exact message and what I expected, without keys or private data.", "عاونّي نفهم خطأ فهاد الجزء. سولني أولا على رسالة الخطأ وشنو كنت كنتوقع، بلا مفاتيح ولا بيانات خاصة."], mode: "debug" },
];

export default function LessonTeacher(props: Props) {
  // Changing lesson, language or selected line starts a separate conversation.
  return <TeacherSession key={[props.lang, props.topic, props.sourcePath, props.sourceLine, props.sourceAnchor].join("|")} {...props} />;
}
function TeacherSession({ lang, topic, context = "", sourcePath, sourceLine = 1, sourceAnchor }: Props) {
  const t = (value: Text) => text(value, lang);
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"explain" | "practice" | "debug">("explain");
  const [replyLanguage, setReplyLanguage] = useState<string>(lang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || request.current) return;
    const controller = new AbortController(); request.current = controller;
    const question = draft.trim();
    const next: Message[] = [...messages, { role: "user", content: question }];
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 45000);
    setPending(true); setError("");
    try {
      // Bound UTF-8 size as well as message count, including Arabic conversations.
      const history = next.slice(-5).map(({ role, content }) => ({ role, content: content.slice(0, 1000) }));
      // Supply the lesson on every turn, even after older messages fall out of history.
      history[history.length - 1].content = `Learning topic: ${topic.slice(0, 200)}\nLesson context: ${context.slice(0, 1200)}\nMy question: ${question}`;
      const response = await fetch("/api/admin/learning-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal, body: JSON.stringify({ messages: history, lang, replyLanguage, mode, ...(sourcePath ? { sourcePath, sourceLine, ...(sourceAnchor ? { sourceAnchor } : {}) } : {}) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "UNLOCK_REQUIRED" : response.status === 429 ? "RATE_LIMITED" : data.error || "UNAVAILABLE");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("UNAVAILABLE");
      if (controller.signal.aborted) return;
      const sources: Source[] = Array.isArray(data.sources) ? data.sources.filter((source: Source) => source && typeof source.path === "string" && Number.isInteger(source.startLine) && Number.isInteger(source.endLine)).slice(0, 6) : [];
      const reply: Message = { role: "assistant", content: data.reply, sources };
      setMessages([...next, reply].slice(-12)); setDraft("");
    } catch (cause) {
      if (request.current !== controller) return;
      setError(timedOut ? "TIMEOUT" : controller.signal.aborted ? "STOPPED" : cause instanceof Error ? cause.message : "UNAVAILABLE");
    } finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setPending(false); } }
  }
  const errorText = error === "UNLOCK_REQUIRED" ? t(["Reconnecte-toi et déverrouille l’espace de code, puis réessaie. Ta question reste ici.", "Sign in and unlock the code area, then retry. Your question stays here.", "سجّل الدخول وافتح مساحة الكود ثم حاول مجددا. سؤالك يبقى هنا."])
    : error === "AI_CONFIGURATION_REQUIRED" ? t(["Le service IA doit être configuré sur le serveur. Tu peux continuer les explications et exercices du cours.", "The AI service needs server configuration. You can continue the course explanations and exercises.", "خدمة الذكاء تحتاج إعدادا في الخادم. يمكنك متابعة شرح وتمارين الدرس."])
    : error === "AI_BILLING_REQUIRED" ? t(["Le compte API du professeur a besoin de crédits. Les cours restent disponibles.", "The teacher’s API account needs credits. Courses remain available.", "حساب API للمعلّم يحتاج رصيدا. الدروس تبقى متاحة."])
    : error === "RATE_LIMITED" ? t(["Patiente quelques minutes avant de réessayer. Ta question est conservée.", "Wait a few minutes before retrying. Your question is preserved.", "انتظر بضع دقائق ثم أعد المحاولة. سؤالك محفوظ."])
    : error === "SOURCE_UNAVAILABLE" || error === "INVALID_SOURCE" ? t(["Le fichier ou le passage n’est pas disponible dans la bibliothèque actuelle. Ouvre-le depuis Mes fichiers pour choisir une ligne disponible.", "The file or passage is unavailable in the current library. Open it from My files to select an available line.", "الملف أو المقطع غير متاح في المكتبة الحالية. افتحه من ملفاتي لاختيار سطر متاح."])
    : error === "STOPPED" ? t(["Réponse arrêtée. Tu peux modifier ta question et la renvoyer.", "Response stopped. You can edit your question and send it again.", "تم إيقاف الرد. يمكنك تعديل السؤال وإرساله مجددا."])
    : t(["Le professeur n’a pas pu répondre à temps. Ta question est conservée : réessaie.", "The teacher could not respond in time. Your question is preserved: try again.", "تعذر رد المعلّم في الوقت المتاح. سؤالك محفوظ: حاول مجددا."]);
  return <aside className={styles.teacher} dir={lang === "ar" ? "rtl" : "ltr"}>
    <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={`${fieldId}-panel`} onClick={() => setOpen(value => !value)}>{t(["Demander au professeur IA", "Ask AI teacher", "اسأل المعلّم الذكي"])} <span aria-hidden="true">{open ? "−" : "+"}</span></button>
    <div id={`${fieldId}-panel`} hidden={!open} className={styles.body}>
      <p className={styles.topic}><strong>{t(["À propos de", "About", "حول"])}:</strong> {topic}</p>
      <p className={styles.note}>{t(["Une réponse adaptée à cette leçon. Vérifie le code cité : l’IA peut se tromper. Les échanges restent dans cette page pendant la visite.", "An explanation for this lesson. Check the cited code: AI can make mistakes. The conversation stays on this page during your visit.", "شرح مرتبط بهذا الدرس. راجع الكود المشار إليه: الذكاء قد يخطئ. المحادثة تبقى في هذه الصفحة خلال الزيارة."])}</p>
      {sourcePath && <p className={styles.path} dir="ltr">{sourcePath}{sourceAnchor ? ` · ${sourceAnchor}` : `:${sourceLine}`}</p>}
      <label className={styles.language}>{t(["Langue de la réponse", "Answer language", "لغة الرد"])}<select value={replyLanguage} disabled={pending} onChange={event => setReplyLanguage(event.target.value)}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option><option value="darija">الدارجة المغربية</option></select></label>
      <div className={styles.prompts}>{prompts.map((prompt, index) => <button type="button" disabled={pending} key={index} onClick={() => { setDraft(t(prompt.question)); setMode(prompt.mode); input.current?.focus(); }}>{t(prompt.label)}</button>)}</div>
      <div className={styles.messages} aria-label={t(["Conversation", "Conversation", "المحادثة"])}>{messages.map((message, index) => <div className={styles.message} data-role={message.role} key={index} dir="auto"><strong>{message.role === "user" ? t(["Moi", "Me", "أنا"]) : t(["Professeur IA", "AI teacher", "المعلّم الذكي"])}</strong><ReactMarkdown components={{ img: ({ alt }) => <span>{alt}</span>, a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{message.content}</ReactMarkdown>{message.sources?.map(source => <a key={source.path} className={styles.source} href={`#files/${encodeURIComponent(source.path)}?line=${source.startLine}`} dir="ltr">{source.path}:{source.startLine}–{source.endLine}</a>)}</div>)}</div>
      <form onSubmit={send}>
        <label htmlFor={fieldId}>{t(["Qu’est-ce que tu veux mieux comprendre ?", "What would you like to understand better?", "ماذا تريد أن تفهم أكثر؟"])}</label>
        <textarea ref={input} id={fieldId} value={draft} disabled={pending} maxLength={1500} rows={3} onChange={event => setDraft(event.target.value)} placeholder={t(["Je ne comprends pas pourquoi… (sans clés ni données privées)", "I don’t understand why… (no keys or private data)", "لم أفهم لماذا… (دون مفاتيح أو بيانات خاصة)"])} />
        <div className={styles.actions}><button type="submit" disabled={pending || !draft.trim()}>{t(["Demander une explication", "Ask for an explanation", "اطلب شرحا"])}</button>{pending && <button type="button" onClick={() => request.current?.abort()}>{t(["Arrêter", "Stop", "إيقاف"])}</button>}</div>
      </form>
      <p role="status" className={styles.note}>{pending ? t(["Le professeur prépare une explication…", "The teacher is preparing an explanation…", "المعلّم يحضّر الشرح…"]) : messages.length ? t(["Tu peux poser une question de suivi.", "You can ask a follow-up question.", "يمكنك طرح سؤال متابعة."]) : ""}</p>
      {error && <p role="alert" className={styles.error}>{errorText}</p>}
    </div>
  </aside>;
}
