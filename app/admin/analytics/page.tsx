"use client";
import { useEffect, useState, useCallback } from "react";

type ViewRow = { path: string; referrer: string | null; user_agent: string | null; created_at: string };
type OrderRow = { total: number; status: string; customer: { city: string } | null; created_at: string };
type DayStat = { date: string; views: number; orders: number; revenue: number };
type PageStat = { path: string; count: number };
type CityStat = { city: string; count: number };

// ── helpers ────────────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>{icon}</div>
        {trend !== undefined && <Trend pct={trend ?? null} />}
      </div>
      <p className="text-xl md:text-2xl font-black leading-none">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [recentViews, setRecentViews] = useState<ViewRow[]>([]);
  const [visitorsToday, setVisitorsToday] = useState(0);
  const [uniqueToday, setUniqueToday] = useState(0);
  const [prevTotals, setPrevTotals] = useState({ views: 0, orders: 0, revenue: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    const [res, prevRes] = await Promise.all([
      fetch(`/api/analytics?days=${period}`),
      fetch(`/api/analytics?days=${period * 2}`),
    ]);
    const raw = await res.json();
    const rawPrev = await prevRes.json();
    setViews(raw.views ?? []);
    setOrders(raw.orders ?? []);
    setRecentViews(raw.recent_views ?? []);
    setVisitorsToday(raw.visitors_today ?? 0);
    setUniqueToday(raw.unique_today ?? 0);

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const pv: ViewRow[] = rawPrev.views ?? [];
    const po: OrderRow[] = rawPrev.orders ?? [];
    setPrevTotals({
      views: pv.filter((v) => v.created_at.split("T")[0] < cutoffStr).length,
      orders: po.filter((o) => o.created_at.split("T")[0] < cutoffStr).length,
      revenue: po.filter((o) => o.created_at.split("T")[0] < cutoffStr && o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0),
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Auto-refresh recent activity every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetch(`/api/analytics?days=${period}`).then((r) => r.json()).then((raw) => {
        setRecentViews(raw.recent_views ?? []);
        setVisitorsToday(raw.visitors_today ?? 0);
        setUniqueToday(raw.unique_today ?? 0);
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [period, autoRefresh]);

  // ── derived ───────────────────────────────────────────────────────────────
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
  const totalUnique = new Set(views.map((v) => v.user_agent ?? "anon")).size;

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
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Analytiques</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Performance de votre boutique</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 gap-0.5">
            {([7, 30, 90] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${period === p ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>
                {p}j
              </button>
            ))}
          </div>
          <button onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-1.5 text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:border-black transition-colors text-neutral-600">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Actualiser
          </button>
          <button onClick={() => setAutoRefresh((x) => !x)}
            className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-2 rounded-xl transition-colors ${autoRefresh ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-neutral-200 text-neutral-500 hover:border-black"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
            Live
          </button>
          <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:border-black transition-colors text-neutral-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            GA4
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Visiteurs aujourd'hui" value={visitorsToday} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} color="bg-sky-50 text-sky-600" trend={null} />
            <StatCard label="Visiteurs uniques" value={totalUnique.toLocaleString("fr-FR")} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} color="bg-blue-50 text-blue-600" trend={null} />
            <StatCard label="Vues totales" value={views.length.toLocaleString("fr-FR")} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} color="bg-violet-50 text-violet-600" trend={trendPct(views.length, prevTotals.views)} />
            <StatCard label="Commandes" value={orders.length} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} color="bg-emerald-50 text-emerald-600" trend={trendPct(orders.length, prevTotals.orders)} />
            <StatCard label="Revenus" value={`${totalRevenue.toLocaleString("fr-MA")} MAD`} sub={`${period}j`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} color="bg-orange-50 text-orange-600" trend={trendPct(totalRevenue, prevTotals.revenue)} />
            <StatCard label="Panier moyen" value={`${aov.toFixed(0)} MAD`} sub="par commande" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>} color="bg-pink-50 text-pink-600" trend={null} />
          </div>

          {/* Views + Revenue charts */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Vues & Visiteurs uniques — {period}j</p>
                <Trend pct={trendPct(views.length, prevTotals.views)} />
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
                <Trend pct={trendPct(totalRevenue, prevTotals.revenue)} />
              </div>
              <p className="text-2xl font-black mb-4">{totalRevenue.toLocaleString("fr-MA")} MAD</p>
              <BarChart data={stats.map((s) => s.revenue)} color="#10b981" labels={dateLabels} />
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300"><span>{dateLabels[0] ?? ""}</span><span>Auj.</span></div>
            </div>
          </div>

          {/* Funnel + Devices + Sources */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Funnel */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
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
                <Trend pct={trendPct(orders.length, prevTotals.orders)} />
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
                <table className="w-full text-sm">
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
                </table>
              </div>
            </div>
          </div>

          {/* Comparison */}
          {prevTotals.views > 0 && (
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
        </>
      )}
    </div>
  );
}


  useEffect(() => {
    setLoading(true);
    async function load() {
      const [res, prevRes] = await Promise.all([
        fetch(`/api/analytics?days=${period}`),
        fetch(`/api/analytics?days=${period * 2}`),
      ]);
      const raw = await res.json();
      const rawPrev = await prevRes.json();
      const views: { path: string; created_at: string }[] = raw.views ?? [];
      const orders: { total: number; status: string; customer: { city: string }; created_at: string }[] = raw.orders ?? [];
      const visitors_today: number = raw.visitors_today ?? 0;

      // Build day-by-day stats
      const dayMap: Record<string, DayStat> = {};
      for (let i = 0; i < period; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (period - 1 - i));
        const key = d.toISOString().split("T")[0];
        dayMap[key] = { date: key, views: 0, orders: 0, revenue: 0 };
      }
      views.forEach((v) => { const key = v.created_at.split("T")[0]; if (dayMap[key]) dayMap[key].views++; });
      orders.forEach((o) => {
        const key = o.created_at.split("T")[0];
        if (dayMap[key]) { dayMap[key].orders++; if (o.status !== "cancelled") dayMap[key].revenue += o.total ?? 0; }
      });
      setStats(Object.values(dayMap));

      // Top pages
      const pageCount: Record<string, number> = {};
      views.forEach((v) => { pageCount[v.path] = (pageCount[v.path] || 0) + 1; });
      setTopPages(Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, count]) => ({ path, count })));

      // Top cities
      const cityCount: Record<string, number> = {};
      orders.forEach((o) => { const c = o.customer?.city; if (c) cityCount[c] = (cityCount[c] || 0) + 1; });
      setTopCities(Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count })));

      const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0);
      const paidOrders = orders.filter((o) => o.status !== "cancelled").length;
      setTotals({ views: views.length, orders: orders.length, revenue: totalRevenue, visitors_today, aov: paidOrders > 0 ? totalRevenue / paidOrders : 0 });

      // Previous period
      const prevViews: { path: string; created_at: string }[] = rawPrev.views ?? [];
      const prevOrders: { total: number; status: string; created_at: string }[] = rawPrev.orders ?? [];
      const prevRevenue = prevOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0);
      // Only count the OLDER half of the double-range
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      const prevV = prevViews.filter((v) => v.created_at.split("T")[0] < cutoffStr).length;
      const prevO = prevOrders.filter((o) => o.created_at.split("T")[0] < cutoffStr).length;
      const prevR = prevOrders.filter((o) => o.created_at.split("T")[0] < cutoffStr && o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0);
      setPrevTotals({ views: prevV, orders: prevO, revenue: prevR });

      setLoading(false);
    }
    load();
  }, [period]);

  function trendPct(cur: number, prev: number): number | null {
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  }

  const viewData = stats.map((s) => s.views);
  const orderData = stats.map((s) => s.orders);
  const revenueData = stats.map((s) => s.revenue);
  const dateLabels = stats.map((s) => new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }));
  const maxView = Math.max(...viewData, 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Analytiques</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Performance de votre boutique</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 gap-0.5">
            {([7, 30, 90] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${period === p ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>
                {p}j
              </button>
            ))}
          </div>
          <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold border border-neutral-200 px-3 py-2 rounded-xl hover:border-black transition-colors text-neutral-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            GA4
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard label="Visiteurs aujourd'hui" value={totals.visitors_today} trend={null}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              color="bg-sky-50 text-sky-600" />
            <StatCard label={`Vues (${period}j)`} value={totals.views.toLocaleString("fr-FR")} trend={trendPct(totals.views, prevTotals.views)}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              color="bg-violet-50 text-violet-600" />
            <StatCard label={`Commandes (${period}j)`} value={totals.orders} trend={trendPct(totals.orders, prevTotals.orders)}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
              color="bg-emerald-50 text-emerald-600" />
            <StatCard label={`Revenus (${period}j)`} value={`${totals.revenue.toLocaleString("fr-MA")} MAD`} trend={trendPct(totals.revenue, prevTotals.revenue)}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
              color="bg-orange-50 text-orange-600" />
            <StatCard label="Panier moyen" value={`${totals.aov.toFixed(0)} MAD`} trend={null} sub="par commande payée"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
              color="bg-pink-50 text-pink-600" />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Vues — {period} jours</p>
                <Trend pct={trendPct(totals.views, prevTotals.views)} />
              </div>
              <p className="text-2xl font-black mb-4">{totals.views.toLocaleString("fr-FR")}</p>
              <BarChart data={viewData} color="#6366f1" labels={dateLabels} />
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300">
                <span>{dateLabels[0] ?? ""}</span><span>Aujourd&apos;hui</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Revenus — {period}j</p>
                <Trend pct={trendPct(totals.revenue, prevTotals.revenue)} />
              </div>
              <p className="text-2xl font-black mb-4">{totals.revenue.toLocaleString("fr-MA")} MAD</p>
              <BarChart data={revenueData} color="#10b981" labels={dateLabels} />
              <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300">
                <span>{dateLabels[0] ?? ""}</span><span>Auj.</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Commandes par jour — {period} jours</p>
              <Trend pct={trendPct(totals.orders, prevTotals.orders)} />
            </div>
            <p className="text-2xl font-black mb-4">{totals.orders} commandes</p>
            <BarChart data={orderData} color="#8b5cf6" labels={dateLabels} />
            <div className="flex justify-between mt-1.5 text-[10px] text-neutral-300">
              <span>{dateLabels[0] ?? ""}</span><span>Aujourd&apos;hui</span>
            </div>
          </div>

          {/* Top pages + Cities */}
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
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Villes (commandes)</p>
                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{totals.orders} total</span>
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

          {/* Comparison block */}
          {prevTotals.views > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-4">Comparaison vs période précédente</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Vues", cur: totals.views, prev: prevTotals.views, fmt: (v: number) => v.toLocaleString("fr-FR") },
                  { label: "Commandes", cur: totals.orders, prev: prevTotals.orders, fmt: (v: number) => String(v) },
                  { label: "Revenus", cur: totals.revenue, prev: prevTotals.revenue, fmt: (v: number) => `${v.toFixed(0)} MAD` },
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

          {/* Daily table */}
          {stats.some((s) => s.views > 0 || s.orders > 0) && (
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Détail journalier</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
