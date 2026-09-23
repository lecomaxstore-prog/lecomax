"use client";

import { useMemo } from "react";
import { describeSourceFile, explainSourceLine } from "@/lib/source-code-guide";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";

type Props = { path: string; lines: string[]; line: number; lang: CourseLanguage; onLineChange: (line: number) => void };

export default function CodeExplanation({ path, lines, line, lang, onLineChange }: Props) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const explanation = useMemo(() => explainSourceLine(path, lines, line, lang), [path, lines, line, lang]);
  return <section id="source-explanation" aria-labelledby="source-explanation-heading" className="scroll-mt-64 border-b border-emerald-100 bg-[#f3faf7] text-neutral-900">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 font-mono text-sm font-bold text-white">?</span>
        <div>
          <h4 id="source-explanation-heading" className="text-sm font-bold">{t("Comprendre mon code", "Understand my code", "افهم الكود الخاص بي")}</h4>
          <p className="text-xs text-emerald-900/70">{t("Une ligne à la fois, avec des mots simples", "One line at a time, in plain language", "سطرًا بسطر بلغة بسيطة")}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" disabled={line <= 1} onClick={() => onLineChange(line - 1)} aria-label={t("Expliquer la ligne précédente", "Explain the previous line", "شرح السطر السابق")} className="min-h-11 rounded-lg border border-emerald-900/15 px-3 text-xs font-semibold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-30">{t("Précédente", "Previous", "السابق")}</button>
        <span dir="ltr" className="px-2 font-mono text-xs tabular-nums">{line} / {lines.length}</span>
        <button type="button" disabled={line >= lines.length} onClick={() => onLineChange(line + 1)} aria-label={t("Expliquer la ligne suivante", "Explain the next line", "شرح السطر التالي")} className="min-h-11 rounded-lg border border-emerald-900/15 px-3 text-xs font-semibold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-30">{t("Suivante", "Next", "التالي")}</button>
      </div>
    </div>
    <div aria-live="polite" aria-atomic="true" data-explanation-kind={explanation.kind} className="space-y-4 p-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{t("Ligne", "Line", "السطر")} {line} · {explanation.recognized ? t("Repère de lecture", "Reading guide", "دليل القراءة") : t("Contexte nécessaire", "Context needed", "يحتاج إلى سياق")}</p>
        <h5 className="mt-1 break-words text-lg font-bold leading-7">{explanation.title}</h5>
        <pre dir="ltr" className="mt-3 max-h-24 overflow-auto rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-xs leading-6 text-emerald-950"><code>{lines[line - 1]?.trim() || t("(ligne vide)", "(empty line)", "(سطر فارغ)")}</code></pre>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div><h6 className="text-xs font-bold text-emerald-900">{t("Ce que fait ce code", "What this code does", "ماذا يفعل هذا الكود")}</h6><p className="mt-1 text-sm leading-6 text-neutral-700">{explanation.meaning}</p></div>
        <div><h6 className="text-xs font-bold text-emerald-900">{t("Pourquoi on l'utilise", "Why we use it", "لماذا نستخدمه")}</h6><p className="mt-1 text-sm leading-6 text-neutral-700">{explanation.purpose}</p></div>
      </div>
      <div className="rounded-xl border border-emerald-900/10 bg-white/80 p-3"><h6 className="text-xs font-bold text-emerald-900">{t("Un exemple pour comprendre", "A simple example", "مثال بسيط للفهم")}</h6><p className="mt-1 break-words text-sm leading-6 text-neutral-700">{explanation.example}</p></div>
    </div>
    <details className="border-t border-emerald-900/10 px-4 py-2">
      <summary className="cursor-pointer py-2 text-xs font-semibold text-emerald-900">{t("À quoi sert ce fichier ?", "What is this file for?", "ما دور هذا الملف؟")}</summary>
      <p className="pb-2 text-sm leading-6 text-neutral-700">{describeSourceFile(path, lang)}</p>
      <p className="pb-2 text-xs leading-5 text-neutral-500">{t("Ces repères expliquent les formes de code reconnues. Le rôle exact dans la boutique dépend aussi des fonctions et des fichiers autour. Les exemples sont illustratifs.", "These guides explain recognized code patterns. The exact role in the shop also depends on surrounding functions and files. Examples are illustrative.", "يشرح هذا الدليل أنماط الكود المعروفة. يعتمد الدور المحدد في المتجر أيضًا على الدوال والملفات المحيطة. الأمثلة للتوضيح.")}</p>
    </details>
  </section>;
}
