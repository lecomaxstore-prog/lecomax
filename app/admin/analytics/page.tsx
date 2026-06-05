"use client";
import { useEffect, useState } from "react";

type DayStat = { date: string; views: number; orders: number; revenue: number };
type PageStat = { path: string; count: number };
type CityStat = { city: string; count: number };

function SparkBar({ data, color = "#000" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-16">
      {data.map((v, i) => (
        <div
          key={i}
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5 }}
          className="flex-1 rounded-sm transition-all"
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

const DAYS = 30;

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [topPages, setTopPages] = useState<PageStat[]>([]);
  const [topCities, setTopCities] = useState<CityStat[]>([]);
  const [totals, setTotals] = useState({ views: 0, orders: 0, revenue: 0, visitors_today: 0 });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/analytics?days=${DAYS}`);
      const raw = await res.json();
      const views: { path: string; created_at: string }[] = raw.views ?? [];
      const orders: { total: number; status: string; customer: { city: string }; created_at: string }[] = raw.orders ?? [];
      const visitors_today: number = raw.visitors_today ?? 0;

      // Build day-by-day stats
      const dayMap: Record<string, DayStat> = {};
      for (let i = 0; i < DAYS; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (DAYS - 1 - i));
        const key = d.toISOString().split("T")[0];
        dayMap[key] = { date: key, views: 0, orders: 0, revenue: 0 };
      }

      views?.forEach((v) => {
        const key = v.created_at.split("T")[0];
        if (dayMap[key]) dayMap[key].views++;
      });

      orders?.forEach((o) => {
        const key = o.created_at.split("T")[0];
        if (dayMap[key]) {
          dayMap[key].orders++;
          if (o.status !== "cancelled") dayMap[key].revenue += o.total ?? 0;
        }
      });

      const dayArr = Object.values(dayMap);
      setStats(dayArr);

      // Top pages
      const pageCount: Record<string, number> = {};
      views?.forEach((v) => { pageCount[v.path] = (pageCount[v.path] || 0) + 1; });
      const topP = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, count]) => ({ path, count }));
      setTopPages(topP);

      // Top cities from orders
      const cityCount: Record<string, number> = {};
      orders?.forEach((o) => { const c = o.customer?.city; if (c) cityCount[c] = (cityCount[c] || 0) + 1; });
      const topC = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));
      setTopCities(topC);

      const totalRevenue = orders?.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
      setTotals({
        views: views?.length ?? 0,
        orders: orders?.length ?? 0,
        revenue: totalRevenue,
        visitors_today: visitors_today ?? 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  const viewData = stats.map((s) => s.views);
  const orderData = stats.map((s) => s.orders);
  const revenueData = stats.map((s) => s.revenue);
  const maxView = Math.max(...viewData, 1);

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black">Analytiques</h1>
          <p className="text-neutral-500 text-sm mt-0.5">30 derniers jours · Google Analytics + données Supabase</p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-semibold border border-neutral-200 px-4 py-2 rounded-xl hover:border-black transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Google Analytics
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Vues aujourd'hui" value={totals.visitors_today}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
          color="bg-blue-50 text-blue-600" />
        <StatCard label="Vues (30j)" value={totals.views.toLocaleString()}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          color="bg-purple-50 text-purple-600" />
        <StatCard label="Commandes (30j)" value={totals.orders}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
          color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Chiffre d'affaires (30j)" value={`${totals.revenue.toFixed(0)} MAD`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          color="bg-orange-50 text-orange-600" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Page views chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Vues de pages — 30 jours</p>
          <p className="text-2xl font-black mb-4">{totals.views.toLocaleString()}</p>
          <SparkBar data={viewData} color="#000" />
          <div className="flex justify-between mt-1 text-[10px] text-neutral-300">
            <span>{stats[0]?.date.slice(5)}</span>
            <span>{stats[stats.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Revenus — 30j</p>
          <p className="text-2xl font-black mb-4">{totals.revenue.toFixed(0)} MAD</p>
          <SparkBar data={revenueData} color="#10b981" />
          <div className="flex justify-between mt-1 text-[10px] text-neutral-300">
            <span>{stats[0]?.date.slice(5)}</span>
            <span>Auj.</span>
          </div>
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Commandes par jour — 30 jours</p>
        <p className="text-2xl font-black mb-4">{totals.orders} commandes</p>
        <SparkBar data={orderData} color="#8b5cf6" />
        <div className="flex justify-between mt-1 text-[10px] text-neutral-300">
          <span>{stats[0]?.date.slice(5)}</span>
          <span>{stats[stats.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Top pages + Cities */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="bg-white rounded-2xl border border-neutral-100">
          <div className="px-5 py-4 border-b border-neutral-50">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Pages les plus visitées</p>
          </div>
          {topPages.length === 0 ? (
            <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de données.</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs text-neutral-300 w-4 text-right font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.path || "/"}</p>
                    {/* progress bar */}
                    <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${(p.count / (topPages[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-700 tabular-nums">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top cities */}
        <div className="bg-white rounded-2xl border border-neutral-100">
          <div className="px-5 py-4 border-b border-neutral-50">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Villes (commandes)</p>
          </div>
          {topCities.length === 0 ? (
            <div className="px-5 py-10 text-center text-neutral-400 text-sm">Pas encore de commandes.</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {topCities.map((c, i) => (
                <div key={c.city} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs text-neutral-300 w-4 text-right font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.city}</p>
                    <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.count / (topCities[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-700 tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily breakdown table */}
      {stats.some((s) => s.views > 0 || s.orders > 0) && (
        <div className="mt-6 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-50">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Détail journalier</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-50 text-xs text-neutral-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-2">Date</th>
                  <th className="text-right px-4 py-2">Vues</th>
                  <th className="text-right px-4 py-2">Commandes</th>
                  <th className="text-right px-4 py-2">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {[...stats].reverse().filter((s) => s.views > 0 || s.orders > 0).slice(0, 14).map((s) => (
                  <tr key={s.date} className="hover:bg-neutral-50">
                    <td className="px-5 py-2.5 text-neutral-600">
                      {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        {s.views > 0 && (
                          <span className="inline-block h-2 rounded-full bg-black/20" style={{ width: `${Math.max(8, (s.views / maxView) * 40)}px` }} />
                        )}
                        {s.views}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{s.orders}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{s.revenue > 0 ? `${s.revenue.toFixed(0)} MAD` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
