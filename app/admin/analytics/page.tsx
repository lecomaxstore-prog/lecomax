"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import ResponsiveTable from "@/components/admin/ResponsiveTable";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchAnalytics } from "@/lib/analytics-fetch";
import MoroccoLiveMap from "@/components/admin/MoroccoLiveMap";
import WeeklySearchMonitoring from "@/components/admin/WeeklySearchMonitoring";

type ViewRow = {
  path: string; referrer: string | null; user_agent: string | null; created_at: string;
  session_id?: string | null; visitor_id?: string | null; ip_masked?: string | null;
  country_code?: string | null; region?: string | null; city?: string | null;
  device_type?: string | null; browser?: string | null; operating_system?: string | null;
  screen_width?: number | null; screen_height?: number | null; language?: string | null; timezone?: string | null;
  latitude?: number | null; longitude?: number | null;
};
type OrderRow = { total: number; status: string; customer: { city: string } | null; created_at: string };
type DayStat = { date: string; views: number; orders: number; revenue: number };
type PageStat = { path: string; count: number };
type CityStat = { city: string; count: number };
type SessionPage = { path: string; created_at: string };
type SessionData = {
  session_id: string;
  pages: SessionPage[];
  user_agent: string | null;
  referrer: string | null;
  started_at: string;
  ended_at: string;
  page_count: number;
  visitor_id: string | null;
  ip_masked: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function isMobile(ua: string | null) {
  if (!ua) return false;
  return /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
function isTablet(ua: string | null) {
  if (!ua) return false;
  return /iPad|Android(?!.*Mobile)/i.test(ua);
}
function parseSource(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace("www.", "");
    if (/google\.|bing\.|yahoo\.|duckduck/.test(host)) return "Recherche";
    if (/instagram\.com|facebook\.com|fb\.com/.test(host)) return "Social";
    if (/tiktok\.com/.test(host)) return "TikTok";
    if (/twitter\.com|t\.co/.test(host)) return "Twitter/X";
    if (/youtube\.com|youtu\.be/.test(host)) return "YouTube";
    if (/whatsapp/.test(host)) return "WhatsApp";
    return host;
  } catch { return "Autre"; }
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}
function countryName(code: string | null | undefined) {
  const normalized = code?.trim().toUpperCase();
  if (!normalized || normalized === "LO" || !/^[A-Z]{2}$/.test(normalized)) return null;
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(normalized) || normalized;
  } catch {
    return normalized;
  }
}
function CountryFlag({ code }: { code: string | null | undefined }) {
  const normalized = code?.trim().toUpperCase();
  if (normalized === "LO") return <span title="Visite locale" aria-label="Visite locale">🏠</span>;
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return <span title="Pays inconnu" aria-label="Pays inconnu">🌐</span>;
  const name = countryName(normalized) || normalized;
  return (
    <span className="relative flex h-[20px] w-[27px] items-center justify-center" title={name}>
      <span className="text-base" aria-hidden="true">🌐</span>
      <img
        src={`https://flagcdn.com/w40/${normalized.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${normalized.toLowerCase()}.png 2x`}
        width="40"
        height="30"
        alt={`Drapeau ${name}`}
        className="absolute inset-0 h-full w-full rounded-[4px] object-cover shadow-[0_1px_4px_rgba(0,0,0,.16)] ring-1 ring-black/[.06]"
        onError={(event) => { event.currentTarget.style.display = "none"; }} loading="lazy" decoding="async"
      />
    </span>
  );
}
function locationLabel(city?: string | null, region?: string | null, country?: string | null) {
  return [city, region, countryName(country)].filter(Boolean).join(", ") || "Localisation inconnue";
}
function funnelLabel(path: string): string | null {
  if (path === "/") return "Accueil";
  if (path.startsWith("/produit/")) return "Produit";
  if (["/boutique", "/homme", "/femme", "/accessoires", "/nouveautes", "/promotions", "/bestsellers"].includes(path)) return "Catalogue";
  if (path === "/panier") return "Panier";
  if (path === "/checkout") return "Checkout";
  return null;
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function BarChart({ data, color = "#000", labels }: { data: number[]; color?: string; labels?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-20">
      {data.map((v, i) => (
        <div
          key={i}
          title={labels?.[i] ? `${labels[i]}: ${v}` : String(v)}
          style={{
            height: `${Math.max(3, (v / max) * 100)}%`,
            background: v > 0 ? color : "#f3f4f6",
            opacity: v > 0 ? (0.35 + (i / data.length) * 0.65) : 1,
          }}
          className="flex-1 rounded-sm transition-all cursor-default hover:opacity-100"
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; trend?: number | null }) {
  return (
    <div className="group rounded-[22px] border border-neutral-200/70 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_16px_40px_rgba(0,0,0,.07)] md:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${color} transition-transform duration-300 group-hover:scale-105`}>{icon}</div>
        {trend !== undefined && <Trend pct={trend ?? null} />}
      </div>
      <p className="text-xl font-black leading-none tracking-tight md:text-2xl">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[.08em] text-neutral-500">{label}</p>
      {sub && <p className="mt-1 text-[9px] font-medium text-neutral-400">{sub}</p>}
    </div>
  );
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 28; const cx = 36; const cy = 36; const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        {slices.map((s, i) => {
          const pct = s.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="10"
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * circ}
              transform="rotate(-90 36 36)" />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[12px] text-neutral-600 flex-1 truncate">{s.label}</span>
            <span className="text-[12px] font-bold tabular-nums">{((s.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SESSION_PAGE_SIZE = 8;
type AnalyticsResponse = {
  views?: ViewRow[]; orders?: OrderRow[]; recent_views?: ViewRow[];
  visitors_today?: number; unique_today?: number; active_now?: number; sessions?: SessionData[];
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [recentViews, setRecentViews] = useState<ViewRow[]>([]);
  const [visitorsToday, setVisitorsToday] = useState(0);
  const [uniqueToday, setUniqueToday] = useState(0);
  const [activeNow, setActiveNow] = useState(0);
  const [prevTotals, setPrevTotals] = useState<{ views: number; orders: number; revenue: number } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [visibleSessionCount, setVisibleSessionCount] = useState(SESSION_PAGE_SIZE);

  const load = useCallback(async () => {
    activeRequest.current?.abort();
    const request = new AbortController();
    activeRequest.current = request;
    setLoading(true);
    setLoadError(false);
    setPrevTotals(null);
    try {
      const raw = await fetchAnalytics<AnalyticsResponse>(period, { signal: request.signal });
      if (request.signal.aborted) return;
      setViews(raw.views ?? []);
      setOrders(raw.orders ?? []);
      setRecentViews(raw.recent_views ?? []);
      setVisitorsToday(raw.visitors_today ?? 0);
      setUniqueToday(raw.unique_today ?? 0);
      setActiveNow(raw.active_now ?? 0);
      setSessions(raw.sessions ?? []);

      setLoading(false);
      // Optional trends must never hold the current report behind a skeleton.
      void fetchAnalytics<{ previous_totals: { views: number; orders: number; revenue: number } }>(period * 2, { previous: true, signal: request.signal })
        .then((comparison) => { if (!request.signal.aborted) setPrevTotals(comparison.previous_totals); })
        .catch(() => { /* Keep trends unavailable instead of reporting false zeroes. */ });
    } catch {
      if (!request.signal.aborted) setLoadError(true);
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    setVisibleSessionCount(SESSION_PAGE_SIZE);
    setExpandedSession(null);
    load();
    return () => activeRequest.current?.abort();
  }, [load]);

  // Auto-refresh recent activity every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const request = new AbortController();
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      fetchAnalytics<AnalyticsResponse>(period, { signal: request.signal }).then((raw) => {
        if (request.signal.aborted) return;
        setRecentViews(raw.recent_views ?? []);
        setVisitorsToday(raw.visitors_today ?? 0);
        setUniqueToday(raw.unique_today ?? 0);
        setActiveNow(raw.active_now ?? 0);
      }).catch(() => { /* Keep the last successful activity during a failed refresh. */ });
    }, 60_000);
    return () => { clearInterval(id); request.abort(); };
  }, [period, autoRefresh]);

  // â”€â”€ derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const paidOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const aov = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  function trendPct(cur: number, prev: number): number | null {
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  }

  // Day-by-day stats
  const dayMap: Record<string, DayStat> = {};
  for (let i = 0; i < period; i++) {
    const d = new Date(); d.setDate(d.getDate() - (period - 1 - i));
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { date: key, views: 0, orders: 0, revenue: 0 };
  }
  views.forEach((v) => { const key = v.created_at.split("T")[0]; if (dayMap[key]) dayMap[key].views++; });
  orders.forEach((o) => { const key = o.created_at.split("T")[0]; if (dayMap[key]) { dayMap[key].orders++; if (o.status !== "cancelled") dayMap[key].revenue += o.total ?? 0; } });
  const stats = Object.values(dayMap);
  const dateLabels = stats.map((s) => new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }));
  const maxView = Math.max(...stats.map((s) => s.views), 1);

  // Unique visitors per day (distinct user_agent as proxy)
  const uniqueDayMap: Record<string, Set<string>> = {};
  views.forEach((v) => { const key = v.created_at.split("T")[0]; if (!uniqueDayMap[key]) uniqueDayMap[key] = new Set(); uniqueDayMap[key].add(v.user_agent ?? "anon"); });
  const uniqueData = stats.map((s) => uniqueDayMap[s.date]?.size ?? 0);
  const totalUnique = new Set(views.map((v) => v.visitor_id || v.session_id || v.ip_masked || v.user_agent || "anon")).size;

  // Top pages
  const pageCount: Record<string, number> = {};
  views.forEach((v) => { pageCount[v.path] = (pageCount[v.path] || 0) + 1; });
  const topPages: PageStat[] = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));

  // Top product pages
  const productPages: PageStat[] = Object.entries(pageCount)
    .filter(([p]) => p.startsWith("/produit/"))
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  // Top cities
  const cityCount: Record<string, number> = {};
  orders.forEach((o) => { const c = o.customer?.city; if (c) cityCount[c] = (cityCount[c] || 0) + 1; });
  const topCities: CityStat[] = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));

  // Traffic sources
  const sourceCount: Record<string, number> = {};
  views.forEach((v) => { const s = parseSource(v.referrer); sourceCount[s] = (sourceCount[s] || 0) + 1; });
  const topSources = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([source, count]) => ({ source, count }));

  // Devices
  const mobile = views.filter((v) => isMobile(v.user_agent) && !isTablet(v.user_agent)).length;
  const tablet = views.filter((v) => isTablet(v.user_agent)).length;
  const desktop = views.length - mobile - tablet;
  const deviceSlices = [
    { label: "Mobile", value: mobile, color: "#6366f1" },
    { label: "Desktop", value: desktop, color: "#10b981" },
    ...(tablet > 0 ? [{ label: "Tablette", value: tablet, color: "#f59e0b" }] : []),
  ];

  // Conversion funnel
  const funnelSteps = ["Accueil", "Catalogue", "Produit", "Panier", "Checkout", "Commande"];
  const funnelCounts: Record<string, number> = { "Accueil": 0, "Catalogue": 0, "Produit": 0, "Panier": 0, "Checkout": 0, "Commande": orders.length };
  views.forEach((v) => { const l = funnelLabel(v.path); if (l) funnelCounts[l] = (funnelCounts[l] || 0) + 1; });
  const funnelMax = Math.max(...Object.values(funnelCounts), 1);
  const funnelColors = ["#6366f1", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];
  const sourceColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"];

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-16">
      {/* Header */}
      <div className="admin-mobile-heading admin-mobile-card-layout mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-600"><span className="h-2 w-2 rounded-full bg-[#3ecf4c] shadow-[0_0_0_4px_rgba(62,207,76,.12)]"/>Intelligence boutique</div>
          <h1 className="text-3xl font-black tracking-[-.035em] sm:text-4xl">Centre analytique</h1>
          <p className="mt-1.5 text-sm text-neutral-500">Comprenez vos visiteurs, leurs parcours et la performance de L&apos;ecomax.</p>
        </div>
        <div className="admin-mobile-actions flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm">
            {([7, 30, 90] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-xl px-3.5 py-2 text-xs font-black transition-all ${period === p ? "bg-black text-white shadow-md" : "text-neutral-400 hover:bg-neutral-50 hover:text-black"}`}>
                {p}j
              </button>
            ))}
          </div>
          <button onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-600 shadow-sm transition hover:border-black">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Actualiser
          </button>
          <button onClick={() => setAutoRefresh((x) => !x)}
            className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-black shadow-sm transition ${autoRefresh ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-white text-neutral-500 hover:border-black"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
            Live
          </button>
          <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-600 shadow-sm transition hover:border-black sm:flex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            GA4
          </a>
        </div>
      </div>

      <WeeklySearchMonitoring />

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p>Le rapport n’a pas pu être chargé. Vérifiez votre connexion puis réessayez.</p>
          <button type="button" onClick={() => void load()} className="mt-3 rounded-xl bg-black px-4 py-2 font-bold text-white">Réessayer</button>
        </div>
      ) : loading ? (
        <AdminLoading />
      ) : (
        <>
          {/* KPI Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            <StatCard label="En ligne maintenant" value={activeNow} sub="5 dernières min" icon={<span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"/></span>} color="bg-emerald-50 text-emerald-600" trend={null} />
            <StatCard label="Visiteurs aujourd'hui" value={visitorsToday} sub={`${uniqueToday} uniques`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} color="bg-sky-50 text-sky-600" trend={null} />
            <StatCard label="Visiteurs uniques" value={totalUnique.toLocaleString("fr-FR")} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} color="bg-blue-50 text-blue-600" trend={null} />
            <StatCard label="Vues totales" value={views.length.toLocaleString("fr-FR")} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} color="bg-violet-50 text-violet-600" trend={prevTotals ? trendPct(views.length, prevTotals.views) : null} />
            <StatCard label="Commandes" value={orders.length} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} color="bg-emerald-50 text-emerald-600" trend={prevTotals ? trendPct(orders.length, prevTotals.orders) : null} />
            <StatCard label="Revenus" value={`${totalRevenue.toLocaleString("fr-MA")} MAD`} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} color="bg-orange-50 text-orange-600" trend={prevTotals ? trendPct(totalRevenue, prevTotals.revenue) : null} />
            <StatCard label="Panier moyen" value={`${aov.toFixed(0)} MAD`} sub="par commande" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>} color="bg-pink-50 text-pink-600" trend={null} />
          </div>

          <MoroccoLiveMap sessions={sessions} period={period} />

          {/* Views + Revenue charts */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Vues & Visiteurs uniques — {period}j</p>
                <Trend pct={prevTotals ? trendPct(views.length, prevTotals.views) : null} />
              </div>
              <p className="text-2xl font-black mb-0.5">{views.length.toLocaleString("fr-FR")}</p>
              <p className="text-[11px] text-neutral-400 mb-3">{totalUnique.toLocaleString("fr-FR")} visiteurs uniques</p>
              <div className="relative">
                <BarChart data={stats.map((s) => s.views)} color="#6366f1" labels={dateLabels} />
                <div className="absolute inset-0 flex items-end gap-[3px] pointer-events-none opacity-40">
                  {uniqueData.map((v, i) => { const mx = Math.max(...stats.map((s) => s.views), 1); return (
                    <div key={i} style={{ height: `${Math.max(3, (v / mx) * 100)}%`, background: v > 0 ? "#10b981" : "transparent" }} className="flex-1 rounded-sm" />
                  ); })}
                </div>
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300"><span>{dateLabels[0] ?? ""}</span><span>Aujourd&apos;hui</span></div>
              <div className="flex gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-indigo-400" />Vues totales</span>
                <span className="flex items-center gap-1 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Uniques</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Revenus — {period}j</p>
                <Trend pct={prevTotals ? trendPct(totalRevenue, prevTotals.revenue) : null} />
              </div>
              <p className="text-2xl font-black mb-4">{totalRevenue.toLocaleString("fr-MA")} MAD</p>
              <BarChart data={stats.map((s) => s.revenue)} color="#10b981" labels={dateLabels} />
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300"><span>{dateLabels[0] ?? ""}</span><span>Auj.</span></div>
            </div>
          </div>

          {/* Funnel + Devices + Sources */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Funnel */}
            <div id="conversion-funnel" className="scroll-mt-24 bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Entonnoir de conversion</p>
              <div className="space-y-2.5">
                {funnelSteps.map((step, i) => {
                  const count = funnelCounts[step] ?? 0;
                  const pct = funnelMax > 0 ? (count / funnelMax) * 100 : 0;
                  const prevStep = i > 0 ? (funnelCounts[funnelSteps[i - 1]] ?? 0) : count;
                  const dropPct = prevStep > 0 && i > 0 ? ((prevStep - count) / prevStep) * 100 : 0;
                  return (
                    <div key={step}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-neutral-700">{step}</span>
                        <div className="flex items-center gap-2">
                          {i > 0 && dropPct > 0 && <span className="text-[10px] text-red-400">-{dropPct.toFixed(0)}%</span>}
                          <span className="text-[13px] font-bold tabular-nums">{count.toLocaleString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: funnelColors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {orders.length > 0 && views.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-50">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Taux de conversion</p>
                  <p className="text-xl font-black mt-0.5">{((orders.length / views.length) * 100).toFixed(2)}%</p>
                </div>
              )}
            </div>

            {/* Devices */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Appareils</p>
              {views.length === 0 ? (
                <p className="text-sm text-neutral-400 py-8 text-center">Pas de données</p>
              ) : (
                <>
                  <DonutChart slices={deviceSlices.filter((s) => s.value > 0)} />
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {deviceSlices.map((s) => (
                      <div key={s.label} className="bg-neutral-50 rounded-xl p-2">
                        <p className="text-[10px] text-neutral-400">{s.label}</p>
                        <p className="text-sm font-black">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Traffic Sources */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Sources de trafic</p>
              </div>
              {topSources.length === 0 ? (
                <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de données.</div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {topSources.map(({ source, count }, i) => (
                    <div key={source} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sourceColors[i % sourceColors.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{source}</p>
                        <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / (topSources[0]?.count || 1)) * 100}%`, background: sourceColors[i % sourceColors.length] }} />
                        </div>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top pages + Top products */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Pages les plus visitées</p>
                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{topPages.length} pages</span>
              </div>
              {topPages.length === 0 ? (
                <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de données.</div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {topPages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-[11px] text-neutral-300 w-4 text-right font-mono shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{p.path || "/"}</p>
                        <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.count / (topPages[0]?.count || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Produits les plus vus</p>
                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{productPages.length} produits</span>
              </div>
              {productPages.length === 0 ? (
                <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de vues produits.</div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {productPages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-[11px] text-neutral-300 w-4 text-right font-mono shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{p.path.replace("/produit/", "")}</p>
                        <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(p.count / (productPages[0]?.count || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orders chart + Cities */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Commandes par jour — {period}j</p>
                <Trend pct={prevTotals ? trendPct(orders.length, prevTotals.orders) : null} />
              </div>
              <p className="text-2xl font-black mb-4">{orders.length} commande{orders.length !== 1 ? "s" : ""}</p>
              <BarChart data={stats.map((s) => s.orders)} color="#8b5cf6" labels={dateLabels} />
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300"><span>{dateLabels[0] ?? ""}</span><span>Aujourd&apos;hui</span></div>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Villes (commandes)</p>
                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{orders.length} total</span>
              </div>
              {topCities.length === 0 ? (
                <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de commandes.</div>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {topCities.map((c, i) => (
                    <div key={c.city} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="text-[11px] text-neutral-300 w-4 text-right font-mono shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{c.city}</p>
                        <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.count / (topCities[0]?.count || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums shrink-0">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live activity + Daily table */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Activité récente</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-semibold">30 dernières min</span>
                </div>
              </div>
              {recentViews.length === 0 ? (
                <div className="px-5 py-10 text-center text-neutral-400 text-sm">Aucune activité récente.</div>
              ) : (
                <div className="divide-y divide-neutral-50 max-h-72 overflow-y-auto">
                  {recentViews.slice(0, 20).map((v, i) => {
                    const device = isTablet(v.user_agent) ? "Tablette" : isMobile(v.user_agent) ? "Mobile" : "Desktop";
                    const source = parseSource(v.referrer);
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-50 flex items-center justify-center shrink-0">
                          {device === "Mobile" ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{v.path || "/"}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{source} · {device}</p>
                        </div>
                        <span className="text-[10px] text-neutral-300 shrink-0">{timeAgo(v.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Détail journalier</p>
              </div>
              <div className="overflow-x-auto">
                <ResponsiveTable className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-50 text-[10px] text-neutral-400 uppercase tracking-wide">
                      <th className="text-left px-5 py-2.5">Date</th>
                      <th className="text-right px-4 py-2.5">Vues</th>
                      <th className="text-right px-4 py-2.5">Commandes</th>
                      <th className="text-right px-4 py-2.5">Revenus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {[...stats].reverse().filter((s) => s.views > 0 || s.orders > 0).slice(0, 14).map((s) => (
                      <tr key={s.date} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-2.5 text-neutral-600 text-[13px]">
                          {new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px]">
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            {s.views > 0 && <span className="inline-block h-1.5 rounded-full bg-violet-300" style={{ width: `${Math.max(8, (s.views / maxView) * 36)}px` }} />}
                            {s.views}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-[13px]">{s.orders > 0 ? s.orders : <span className="text-neutral-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[13px]">{s.revenue > 0 ? `${s.revenue.toFixed(0)} MAD` : <span className="text-neutral-300">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
              </div>
            </div>
          </div>

          {/* Comparison */}
          {prevTotals && prevTotals.views > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Comparaison vs période précédente</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Vues", cur: views.length, prev: prevTotals.views, fmt: (v: number) => v.toLocaleString("fr-FR") },
                  { label: "Commandes", cur: orders.length, prev: prevTotals.orders, fmt: (v: number) => String(v) },
                  { label: "Revenus", cur: totalRevenue, prev: prevTotals.revenue, fmt: (v: number) => `${v.toFixed(0)} MAD` },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-base font-black">{item.fmt(item.cur)}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">avant: {item.fmt(item.prev)}</p>
                    <div className="mt-1.5"><Trend pct={trendPct(item.cur, item.prev)} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visitor Journeys */}
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mt-4">
            <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Parcours visiteurs détaillés</p>
                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] text-indigo-600 font-semibold">IP protégées · {period}j</span>
              </div>
            </div>
            {sessions.length === 0 ? (
              <div className="px-5 py-10 text-center text-neutral-400 text-sm">
                <p className="font-medium mb-1">Aucun parcours enregistré</p>
                <p className="text-[12px]">Les parcours s&apos;afficheront dès que des visiteurs naviguent sur le site.</p>
                <p className="text-[11px] mt-2 text-neutral-300">Si c&apos;est la première activation, exécutez dans Supabase SQL :</p>
                <code className="text-[11px] bg-neutral-100 px-2 py-1 rounded mt-1 inline-block text-neutral-500">ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;</code>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {sessions.slice(0, visibleSessionCount).map((s) => {
                  const device = s.device_type || (isTablet(s.user_agent) ? "Tablette" : isMobile(s.user_agent) ? "Mobile" : "Desktop");
                  const source = parseSource(s.referrer);
                  const durationSec = Math.max(0, Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000));
                  const duration = durationSec < 60 ? `${durationSec}s` : `${Math.floor(durationSec / 60)}min ${durationSec % 60}s`;
                  const isExpanded = expandedSession === s.session_id;
                  return (
                    <div key={s.session_id}>
                      <button
                        onClick={() => setExpandedSession(isExpanded ? null : s.session_id)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-center shrink-0"><CountryFlag code={s.country_code} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-semibold truncate">{s.pages[0]?.path || "/"}</p>
                            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full shrink-0">{s.page_count} page{s.page_count !== 1 ? "s" : ""}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{locationLabel(s.city, s.region, s.country_code)} · {source} · {device} · {duration}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-neutral-300">{timeAgo(s.started_at)}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} className="text-neutral-300"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-neutral-50/70">
                          <div className="pt-3 space-y-0">
                            {s.pages.map((page, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="flex flex-col items-center shrink-0 mt-1.5">
                                  <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-emerald-500" : idx === s.pages.length - 1 ? "bg-red-400" : "bg-neutral-300"}`} />
                                  {idx < s.pages.length - 1 && <div className="w-px h-6 bg-neutral-200 mt-0.5" />}
                                </div>
                                <div className="flex-1 min-w-0 pb-1.5">
                                  <p className="text-[12px] font-medium text-neutral-700 truncate">{page.path || "/"}</p>
                                  <p className="text-[10px] text-neutral-400">{new Date(page.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mb-3 grid grid-cols-2 gap-2 pt-3 sm:grid-cols-3 lg:grid-cols-6">
                            {[
                              ["IP protégée", s.ip_masked || "Indisponible"],
                              ["Navigateur", s.browser || "Inconnu"],
                              ["Système", s.operating_system || "Inconnu"],
                              ["Écran", s.screen_width && s.screen_height ? `${s.screen_width}×${s.screen_height}` : "Inconnu"],
                              ["Langue", s.language || "Inconnue"],
                              ["Fuseau", s.timezone || "Inconnu"],
                            ].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-100 bg-white p-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{label}</p><p className="mt-1 truncate text-[11px] font-black text-neutral-700" title={value}>{value}</p></div>)}
                          </div>
                          <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[10px] text-neutral-400">Entrée</p>
                              <p className="text-[11px] font-semibold text-neutral-600 truncate">{s.pages[0]?.path || "/"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-400">Durée</p>
                              <p className="text-[11px] font-semibold">{duration}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-400">Sortie</p>
                              <p className="text-[11px] font-semibold text-neutral-600 truncate">{s.pages[s.pages.length - 1]?.path || "/"}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(sessions.length > visibleSessionCount || visibleSessionCount > SESSION_PAGE_SIZE) && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-4 sm:px-5">
                    <div className="mx-auto max-w-sm">
                      <div className="mb-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em]">
                        <span className="text-neutral-500">{Math.min(visibleSessionCount, sessions.length)} affichées</span>
                        <span className="text-neutral-300">{sessions.length} au total</span>
                      </div>
                      <div className="mb-3 h-1 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-[#3ecf4c] transition-[width] duration-300"
                          style={{ width: `${Math.min(100, (visibleSessionCount / sessions.length) * 100)}%` }}
                        />
                      </div>
                      {sessions.length > visibleSessionCount ? (
                        <button
                          type="button"
                          onClick={() => setVisibleSessionCount((count) => Math.min(count + SESSION_PAGE_SIZE, sessions.length))}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-[11px] font-black uppercase tracking-[0.12em] text-neutral-800 shadow-sm transition hover:border-[#3ecf4c]/50 hover:text-[#188c2d]"
                        >
                          Voir plus
                          <span className="rounded-full bg-[#effcf1] px-2 py-0.5 text-[9px] text-[#188c2d]">
                            +{Math.min(SESSION_PAGE_SIZE, sessions.length - visibleSessionCount)}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setVisibleSessionCount(SESSION_PAGE_SIZE); setExpandedSession(null); }}
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400 transition hover:bg-white hover:text-neutral-700"
                        >
                          Afficher moins
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
