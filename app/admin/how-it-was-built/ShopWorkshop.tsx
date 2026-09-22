"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseLanguage } from "./course/types";
import { localized, translate } from "./course/journey";
import { readMissionProgress, SHOP_MISSIONS } from "./course/shop-missions";

const STORAGE_KEY = "lecomax-shop-missions-v1";

export default function ShopWorkshop({ lang, onLesson }: { lang: CourseLanguage; onLesson: (moduleId: string) => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [active, setActive] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [count, setCount] = useState(0);
  const [destination, setDestination] = useState("");
  const [reflection, setReflection] = useState("");
  const [recall, setRecall] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const mission = SHOP_MISSIONS[active];
  const correct = choice === mission.answer;
  const passed = checked && correct;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      const progress = readMissionProgress(saved?.done);
      setDone(progress);
      const next = SHOP_MISSIONS.findIndex(item => !progress.includes(item.id));
      setActive(next < 0 ? 0 : next);
    } catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ done })); }
    catch { setStorageError(true); }
  }, [ready, done]);

  const open = (index: number) => {
    setActive(index); setChoice(null); setChecked(false); setCount(0);
    setDestination(""); setReflection(""); setRecall(false);
    requestAnimationFrame(() => { title.current?.focus({ preventScroll: true }); title.current?.scrollIntoView({ block: "start" }); });
  };
  const snippet = mission.before + (mission.after ? choice === null ? "___" : mission.options[choice] : "") + mission.after;
  const buttonClass = "min-h-12 rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-40";

  return <section id="shop-workshop" aria-labelledby="shop-workshop-heading" className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
    <div className="bg-violet-50 p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-wider text-violet-700">{t("Commence par jouer", "Start by playing", "ابدأ بالتجربة")}</p>
      <h3 id="shop-workshop-heading" className="mt-2 text-2xl font-black">{t("Construis ta mini-boutique", "Build your mini shop", "ابنِ متجرك المصغّر")}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{t("Une idée, un choix, un résultat. Essaie une mission en 5 minutes, puis refais-la dans ton projet. Tu peux te tromper autant que nécessaire.", "One idea, one choice, one result. Try a mission in 5 minutes, then rebuild it in your project. You can make as many mistakes as you need.", "فكرة واحدة، اختيار واحد، نتيجة واضحة. جرّب مهمة في 5 دقائق ثم أعد بناءها في مشروعك. الأخطاء مسموحة بلا حدود.")}</p>
      <p data-workshop-score className="mt-3 text-sm font-bold text-violet-800">{done.length}/{SHOP_MISSIONS.length} {t("missions découvertes", "missions explored", "مهام مستكشفة")} {done.length === SHOP_MISSIONS.length && "🏅"}</p>
      <nav aria-label={t("Missions de la boutique", "Shop missions", "مهام المتجر")} className="mt-4 flex flex-wrap gap-2">
        {SHOP_MISSIONS.map((item, index) => <button key={item.id} type="button" data-shop-mission={item.id} disabled={!ready} onClick={() => open(index)} aria-current={active === index ? "step" : undefined} className={buttonClass + (active === index ? " border-violet-700 bg-violet-700 text-white" : " border-violet-200 bg-white text-neutral-800")}><span aria-hidden="true">{done.includes(item.id) ? "✓" : item.icon}</span> {index + 1}. {localized(lang, item.title)}</button>)}
      </nav>
    </div>

    <div className="space-y-5 p-5 sm:p-7">
      <h4 ref={title} tabIndex={-1} className="scroll-mt-40 text-xl font-black outline-none">{mission.icon} {localized(lang, mission.title)}</h4>
      {!recall && <p className="max-w-3xl text-base leading-7">{localized(lang, mission.idea)}</p>}
      {recall && <button type="button" onClick={() => setRecall(false)} className={buttonClass + " border-violet-200"}>{t("Revoir l’explication", "Show the explanation again", "اعرض الشرح مجددًا")}</button>}
      <fieldset disabled={!ready} className="min-w-0">
        <legend className="mb-3 font-bold">{localized(lang, mission.task)}</legend>
        <div className="grid gap-2 sm:grid-cols-3">{mission.options.map((option, index) => <label key={option} className={"flex min-h-14 min-w-0 cursor-pointer items-start gap-2 rounded-xl border p-3 " + (choice === index ? "border-violet-500 bg-violet-50" : "border-neutral-200")}><input type="radio" name="shop-answer" data-shop-choice={index} checked={choice === index} onChange={() => { setChoice(index); setChecked(false); setCount(0); setDestination(""); }} className="mt-1 h-4 w-4 shrink-0 accent-violet-700" /><code dir="ltr" className="break-all text-start text-sm leading-6">{option}</code></label>)}</div>
      </fieldset>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-neutral-950 text-white">
          <p dir="ltr" className="break-all border-b border-white/15 px-4 py-3 font-mono text-xs text-violet-200">{mission.id === "page" ? choice === null ? "? / page.tsx" : mission.options[choice] : mission.filename}</p>
          {recall ? <p className="p-4 text-sm leading-7">{t("Exemple masqué : retrouve l’idée de mémoire.", "Example hidden: recall the idea from memory.", "المثال مخفي: استرجع الفكرة من الذاكرة.")}</p> : <pre dir="ltr" tabIndex={0} aria-label={t("Exemple de code", "Code example", "مثال الكود")} className="max-h-80 overflow-auto p-4 text-xs leading-6 sm:text-sm"><code>{snippet}</code></pre>}
        </div>
        <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-bold text-neutral-500">{t("Aperçu pédagogique · simulation", "Teaching preview · simulation", "معاينة تعليمية · محاكاة")}</p>
          <div data-shop-preview className="mt-3 space-y-3 rounded-xl border bg-white p-4">
            {choice === null ? <p className="text-sm leading-6 text-neutral-500">{t("Choisis une réponse, puis observe ce qu’elle ferait.", "Choose an answer, then see what it would do.", "اختر إجابة ثم شاهد ما ستفعله.")}</p> : <>
              {mission.id === "page" && <><code dir="ltr" className="text-xs text-neutral-500">/boutique</code><p className="text-xl font-bold">{correct ? "Ma boutique" : t("404 · Page manquante", "404 · Missing page", "404 · صفحة مفقودة")}</p></>}
              {mission.id === "link" && <><button type="button" data-shop-link onClick={() => setDestination(mission.options[choice].replaceAll('"', ''))} className={buttonClass + " border-violet-200 text-violet-800"}>{t("Ouvrir le lien", "Open the link", "افتح الرابط")}</button><p dir="ltr" className="break-all text-sm">{destination || "/"}</p>{destination && <p>{correct ? "Ma boutique" : t("Cette adresse ne mène pas à la boutique.", "This address does not lead to the shop.", "هذا العنوان لا يؤدي إلى المتجر.")}</p>}</>}
              {mission.id === "props" && <><span aria-hidden="true" className="text-4xl">{choice === 1 ? "👜" : "💡"}</span><p className="text-xl font-bold">{mission.options[choice].replaceAll('"', '')}</p></>}
              {mission.id === "state" && <><button type="button" data-shop-cart onClick={() => setCount(previous => choice === 0 ? previous + 1 : choice === 1 ? 1 : previous)} className={buttonClass + " border-emerald-700 bg-emerald-700 text-white"}>{t("Ajouter au panier", "Add to cart", "أضف للسلة")}</button><p aria-live="polite" data-shop-count className="text-2xl font-black">{t("Quantité", "Quantity", "الكمية")} : {count}</p></>}
              {mission.id === "server" && <p className="text-sm leading-7">{correct ? t("🔒 Clé privée → serveur. Le navigateur reçoit seulement les données autorisées.", "🔒 Private key → server. The browser receives only permitted data.", "🔒 المفتاح الخاص ← الخادم. المتصفح يستقبل البيانات المسموح بها فقط.") : t("⚠ Cette option placerait le secret dans du code accessible au navigateur.", "⚠ This choice would place the secret in code accessible to the browser.", "⚠ هذا الاختيار يضع السر في كود يمكن للمتصفح الوصول إليه.")}</p>}
            </>}
          </div>
        </div>
      </div>
      <button type="button" data-shop-check disabled={choice === null || !ready} onClick={() => setChecked(true)} className={buttonClass + " border-violet-700 bg-violet-700 text-white"}>{t("Vérifier et comprendre", "Check and understand", "تحقّق وافهم")}</button>
      {checked && choice !== null && <div data-shop-feedback role="status" className={"rounded-2xl p-4 text-sm leading-7 " + (correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950")}><p className="font-bold">{correct ? t("Bien joué ! Voilà pourquoi…", "You got it! Here is why…", "أحسنت! إليك السبب…") : t("Un essai utile. Regarde ce qui change…", "A useful attempt. Look at what changes…", "محاولة مفيدة. لاحظ ما يتغير…")}</p>{localized(lang, mission.explanations[choice])}</div>}
      {passed && <div className="space-y-4 rounded-2xl border border-emerald-200 p-4">
        <p className="font-bold">{t("Maintenant, garde l’idée en mémoire", "Now make the idea stick", "الآن ثبّت الفكرة")}</p>
        <label className="block text-sm leading-6">{t("Sans recopier : pourquoi cette réponse fonctionne-t-elle ? Une phrase suffit.", "Without copying: why does this answer work? One sentence is enough.", "دون نسخ: لماذا تعمل هذه الإجابة؟ تكفي جملة واحدة.")}<textarea data-shop-reflection value={reflection} onChange={event => setReflection(event.target.value)} maxLength={500} rows={2} className="mt-2 w-full rounded-xl border p-3 text-base" /></label>
        <p className="text-xs text-neutral-500">{t("Cette note est un exercice personnel ; elle n’est pas corrigée automatiquement ni conservée.", "This note is a personal exercise; it is not automatically graded or saved.", "هذه الملاحظة تدريب شخصي؛ لا يتم تقييمها تلقائيًا أو حفظها.")}</p>
        <button type="button" data-shop-complete disabled={!reflection.trim() || done.includes(mission.id)} onClick={() => setDone(previous => previous.includes(mission.id) ? previous : [...previous, mission.id])} className={buttonClass + " border-emerald-700 bg-emerald-700 text-white"}>{done.includes(mission.id) ? t("Mission découverte ✓", "Mission explored ✓", "استكشفت المهمة ✓") : t("Je peux l’expliquer ✓", "I can explain it ✓", "أستطيع شرحها ✓")}</button>
        <details className="rounded-xl bg-emerald-50 p-4"><summary className="min-h-11 cursor-pointer font-bold">{t("À refaire dans mon vrai projet", "Rebuild it in my own project", "أعد بناءها في مشروعي")}</summary><p className="mt-2 text-sm leading-7">{localized(lang, mission.transfer)}</p><button type="button" onClick={() => onLesson(mission.moduleId)} className={buttonClass + " mt-3 border-emerald-300 bg-white"}>{t("Ouvrir le cours pas à pas", "Open the step-by-step lesson", "افتح الدرس خطوة بخطوة")}</button></details>
        {done.includes(mission.id) && active < SHOP_MISSIONS.length - 1 && <button type="button" data-shop-next onClick={() => open(active + 1)} className={buttonClass + " border-neutral-900 bg-neutral-900 text-white"}>{t("Mission suivante →", "Next mission →", "المهمة التالية ←")}</button>}
      </div>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" disabled={!ready} onClick={() => { setChoice(null); setChecked(false); setReflection(""); setCount(0); setDestination(""); setRecall(true); }} className={buttonClass + " border-neutral-200"}>{t("Rejouer de mémoire", "Replay from memory", "أعدها من الذاكرة")}</button>
        <a href={mission.source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-violet-800 underline">{t("Documentation officielle", "Official documentation", "التوثيق الرسمي")}</a>
      </div>
      {recall && <p role="status" className="text-sm text-violet-800">{t("La réponse est masquée. Retrouve-la et explique-la à voix haute. Tes missions acquises restent cochées.", "The answer is hidden. Find it again and explain it aloud. Your explored missions stay checked.", "الإجابة مخفية. تذكّرها واشرحها بصوت عالٍ. تبقى المهام المستكشفة مسجّلة.")}</p>}
      <p className="text-xs leading-5 text-neutral-500">{storageError ? t("Sauvegarde indisponible sur ce navigateur.", "Saving is unavailable in this browser.", "الحفظ غير متاح في هذا المتصفح.") : t("Les missions sont mémorisées sur ce navigateur. Elles préparent les leçons et ne remplacent pas leur validation pour le rappel du soir.", "Missions are remembered in this browser. They prepare you for lessons and do not count as lesson completion for the evening reminder.", "تُحفظ المهام في هذا المتصفح. إنها تهيّئك للدروس ولا تُعدّ إكمالًا لدرس لإلغاء تذكير المساء.")}</p>
      <div className="rounded-2xl bg-violet-50 p-4"><p className="font-bold">{t("Prêt à construire pour de vrai ?", "Ready to build for real?", "مستعد للبناء فعلًا؟")}</p><p className="mt-2 text-sm leading-6">{t("Le parcours commence par installer les outils et créer ton dossier, puis avance jusqu’aux produits, aux comptes, au paiement et à la publication. Commence avec un projet d’entraînement.", "The journey starts with installing your tools and creating a folder, then builds up to products, accounts, payments and publishing. Begin with a practice project.", "يبدأ المسار بتثبيت الأدوات وإنشاء مجلد، ثم المنتجات والحسابات والدفع والنشر. ابدأ بمشروع تدريب.")}</p><button type="button" onClick={() => onLesson("module-00-learning-tools")} className={buttonClass + " mt-3 border-violet-700 bg-white text-violet-800"}>{t("Créer mon site depuis zéro", "Build my site from zero", "ابنِ موقعي من الصفر")}</button></div>
    </div>
  </section>;
}
