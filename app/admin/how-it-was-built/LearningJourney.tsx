"use client";

import type { CourseIndex, CourseLanguage, CourseManifest } from "./course/types";
import { JOURNEY, localized, translate } from "./course/journey";

export default function LearningJourney({ lang, manifest, index, completed, onNavigate }: {
  lang: CourseLanguage; manifest: CourseManifest; index: CourseIndex | null;
  completed: Set<string>; onNavigate: (moduleId: string, lessonId: string) => void;
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const ordered = JOURNEY.flatMap(stage => stage.modules.map(order => manifest.modules[order]));
  const nextModule = ordered.find(module => module.lessonIds.some(id => !completed.has(id)));
  const nextId = nextModule?.lessonIds.find(id => !completed.has(id));
  const nextTitle = nextModule && nextId && index?.modules[nextModule.order]?.lessonTitles[nextModule.lessonIds.indexOf(nextId)];
  return <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
    <div className="bg-emerald-50 p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">{t("Ta quête · Zéro → Héros", "Your quest · Zero → Hero", "رحلتك · من الصفر إلى الاحتراف")}</p>
      <h3 className="mt-2 text-2xl font-black">{t("Une petite victoire à la fois.", "One small win at a time.", "إنجاز صغير في كل خطوة.")}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{t("Commence par 15 minutes : découvre une idée, essaie-la, puis explique-la avec tes mots. Avance quand tu comprends. Tu peux toujours revoir une étape.", "Start with 15 minutes: discover an idea, try it, then explain it in your own words. Move on when it makes sense. You can always revisit a step.", "ابدأ بـ15 دقيقة: اكتشف فكرة، جرّبها، ثم اشرحها بكلماتك. تقدّم عندما تفهم، ويمكنك مراجعة أي خطوة.")}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {nextModule && nextId ? <button onClick={() => onNavigate(nextModule.id, nextId)} className="min-h-12 rounded-xl bg-neutral-950 px-5 py-3 text-start text-sm font-black text-white">{t("Ma prochaine mission", "My next mission", "مهمتي التالية")} →<span className="mt-1 block text-xs font-normal text-white/75">{nextTitle ?? t("Commencer ici", "Start here", "ابدأ هنا")}</span></button> : <p className="font-bold text-emerald-800">{t("Parcours terminé ! Reprends un projet sans regarder sa solution.", "Journey complete! Rebuild a project without its solution.", "أكملت الرحلة! أعد بناء مشروع دون النظر إلى الحل.")}</p>}
        <span className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold">⭐ {completed.size * 25} XP · {completed.size}/{manifest.lessonCount}</span>
      </div>
      <p className="mt-3 text-xs text-neutral-500">{t("25 XP par leçon terminée, une seule fois. Ce sont des repères de progression, pas une mesure de maîtrise.", "25 XP per completed lesson, counted once. These track progress, not mastery.", "25 نقطة لكل درس مكتمل تُحسب مرة واحدة. النقاط لمتابعة التقدم وليست مقياسًا للإتقان.")}</p>
    </div>
    <details className="p-4 sm:p-6">
      <summary className="min-h-11 cursor-pointer font-bold">{t("Voir la carte complète · 8 étapes jusqu’à ta boutique", "See the full map · 8 stages to your shop", "اعرض الخريطة كاملة · 8 مراحل لبناء متجرك")}</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {JOURNEY.map((stage, stageIndex) => {
        const modules = stage.modules.map(order => manifest.modules[order]);
        const ids = modules.flatMap(module => module.lessonIds);
        const count = ids.filter(id => completed.has(id)).length;
        return <details key={stageIndex} className="group rounded-2xl border border-neutral-200 p-4 open:border-emerald-400">
          <summary className="min-h-12 cursor-pointer list-none"><div className="flex gap-3"><span aria-hidden="true" className="text-2xl">{count === ids.length ? "🏆" : stage.icon}</span><div className="flex-1"><p className="text-xs font-bold text-neutral-500">{stageIndex + 1} / {JOURNEY.length} · {count}/{ids.length}</p><h4 className="mt-1 font-black">{localized(lang, stage.title)}</h4><p className="mt-1 text-xs leading-5 text-neutral-600">{localized(lang, stage.project)}</p></div><span aria-hidden="true" className="text-emerald-600">＋</span></div></summary>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full bg-emerald-500" style={{ width: `${count / ids.length * 100}%` }} /></div>
          <div className="mt-4 space-y-2">{modules.map(module => <button key={module.id} onClick={() => onNavigate(module.id, module.lessonIds.find(id => !completed.has(id)) ?? module.lessonIds[0])} className="min-h-11 w-full rounded-xl bg-neutral-50 p-3 text-start text-sm hover:bg-emerald-50"><span className="me-2 text-emerald-700">{module.lessonIds.every(id => completed.has(id)) ? "✓" : "○"}</span>{index?.modules[module.order]?.title ?? module.id}</button>)}</div>
        </details>;
      })}
    </div>
    </details>
  </section>;
}
