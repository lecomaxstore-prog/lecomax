"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lecomax-weekly-search-monitoring-v1";
const checks = [
  { id: "search-console", label: "Google Search Console", detail: "Pages, Shopping, performances, requêtes et erreurs d’indexation", href: "https://search.google.com/search-console?resource_id=sc-domain%3Alecomax.com" },
  { id: "merchant-center", label: "Google Merchant Center", detail: "Produits refusés, avertissements et changements de statut", href: "https://merchants.google.com/mc/products/diagnostics" },
  { id: "bing", label: "Bing Webmaster Tools", detail: "Site Scan, URL Inspection et performances Bing", href: "https://www.bing.com/webmasters/home?siteUrl=https%3A%2F%2Flecomax.com%2F" },
  { id: "web-vitals", label: "Core Web Vitals", detail: "LCP, INP et CLS sur données réelles", href: "https://pagespeed.web.dev/analysis?url=https%3A%2F%2Flecomax.com%2F" },
  { id: "orders", label: "Commandes et conversion", detail: "Comparer trafic, commandes, revenus et taux de conversion", href: "#conversion-funnel" },
] as const;

type StoredReview = { week: string; completed: string[]; reviewedAt?: string };

function weekKey(date = new Date()) {
  const first = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date.getTime() - first.getTime()) / 86_400_000);
  return `${date.getUTCFullYear()}-W${String(Math.ceil((day + first.getUTCDay() + 1) / 7)).padStart(2, "0")}`;
}

export default function WeeklySearchMonitoring() {
  const currentWeek = useMemo(() => weekKey(), []);
  const [review, setReview] = useState<StoredReview>({ week: currentWeek, completed: [] });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredReview | null;
      if (stored?.week === currentWeek) setReview(stored);
    } catch { /* Start a fresh review when local storage is unavailable. */ }
  }, [currentWeek]);

  function save(next: StoredReview) {
    setReview(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* non-critical */ }
  }

  function toggle(id: string) {
    const completed = review.completed.includes(id) ? review.completed.filter((item) => item !== id) : [...review.completed, id];
    save({ week: currentWeek, completed, reviewedAt: completed.length === checks.length ? new Date().toISOString() : review.reviewedAt });
  }

  const progress = Math.round((review.completed.length / checks.length) * 100);

  return (
    <section className="mb-6 overflow-hidden rounded-[24px] border border-emerald-200/80 bg-white shadow-[0_12px_36px_rgba(16,185,129,.07)]">
      <div className="flex flex-col gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Revue hebdomadaire · {currentWeek}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-.02em]">Monitoring recherche et croissance</h2>
          <p className="mt-1 text-xs text-neutral-500">Ouvrez chaque rapport, traitez les alertes, puis cochez l’étape.</p>
        </div>
        <div className="min-w-36">
          <div className="flex items-center justify-between text-[10px] font-black"><span>Progression</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
      <div className="grid divide-y divide-neutral-100 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        {checks.map((check) => {
          const complete = review.completed.includes(check.id);
          return (
            <div key={check.id} className="flex min-w-0 flex-col p-4">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => toggle(check.id)} aria-label={`Marquer ${check.label} comme ${complete ? "non vérifié" : "vérifié"}`} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${complete ? "border-emerald-500 bg-emerald-500 text-white" : "border-neutral-300 bg-white text-transparent hover:border-emerald-400"}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg>
                </button>
                <div className="min-w-0"><p className="text-sm font-black">{check.label}</p><p className="mt-1 text-[11px] leading-4 text-neutral-500">{check.detail}</p></div>
              </div>
              <a href={check.href} target={check.href.startsWith("http") ? "_blank" : undefined} rel={check.href.startsWith("http") ? "noopener noreferrer" : undefined} className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-emerald-700 hover:underline">Ouvrir le rapport <span aria-hidden="true">↗</span></a>
            </div>
          );
        })}
      </div>
      {review.reviewedAt && progress === 100 && <p className="border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-xs font-bold text-emerald-800">Revue terminée cette semaine. La checklist se réinitialisera automatiquement la semaine prochaine.</p>}
    </section>
  );
}
