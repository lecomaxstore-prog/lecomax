"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = { products: number; orders: number; revenue: number; pending: number; delivered: number; cancelled: number };
type RecentOrder = { id: string; order_number: string; customer: { name: string }; total: number; status: string; created_at: string };
type DayStat = { date: string; revenue: number; orders: number };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée",
  delivered: "Livrée", cancelled: "Annulée",
};

function SparkBar({ data, color = "#000" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-12">
      {data.map((v, i) => (
        <div key={i} style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: 0.35 + (i / data.length) * 0.65 }}
          className="flex-1 rounded-sm transition-all" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, revenue: 0, pending: 0, delivered: 0, cancelled: 0 });
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [dayStats, setDayStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    async function load() {
      const [productsRes, ordersRes, analyticsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
        fetch(`/api/analytics?days=${period}`),
      ]);
      const productsData = productsRes.ok ? await productsRes.json() : [];
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : { orders: [] };

      const allOrders: RecentOrder[] = Array.isArray(ordersData) ? ordersData : [];
      const revenue = allOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0);
      const pending = allOrders.filter((o) => o.status === "pending").length;
      const delivered = allOrders.filter((o) => o.status === "delivered").length;
      const cancelled = allOrders.filter((o) => o.status === "cancelled").length;

      setStats({ products: Array.isArray(productsData) ? productsData.length : 0, orders: allOrders.length, revenue, pending, delivered, cancelled });
      setRecent(allOrders.slice(0, 6));

      // Build day stats from analytics
      const anaOrders: { total: number; status: string; created_at: string }[] = analyticsData.orders ?? [];
      const dayMap: Record<string, DayStat> = {};
      for (let i = 0; i < period; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (period - 1 - i));
        const key = d.toISOString().split("T")[0];
        dayMap[key] = { date: key, revenue: 0, orders: 0 };
      }
      anaOrders.forEach((o) => {
        const key = o.created_at.split("T")[0];
        if (dayMap[key]) { dayMap[key].orders++; if (o.status !== "cancelled") dayMap[key].revenue += o.total; }
      });
      setDayStats(Object.values(dayMap));
      setLoading(false);
    }
    load();
  }, [period]);

  const revenueData = dayStats.map((d) => d.revenue);
  const ordersData7 = dayStats.map((d) => d.orders);
  const totalPeriodRevenue = revenueData.reduce((a, b) => a + b, 0);
  const totalPeriodOrders = ordersData7.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Tableau de bord</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Bienvenue dans votre espace admin L&apos;ECOMAX</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1">
          {([7, 30] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${period === p ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>
              {p}j
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Chiffre d'affaires", value: `${stats.revenue.toLocaleString("fr-MA")} MAD`,
                sub: `${totalPeriodRevenue.toLocaleString("fr-MA")} MAD sur ${period}j`,
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
                color: "bg-emerald-50 text-emerald-600", href: "/admin/orders",
              },
              {
                label: "Commandes totales", value: stats.orders,
                sub: `${totalPeriodOrders} sur ${period}j`,
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
                color: "bg-blue-50 text-blue-600", href: "/admin/orders",
              },
              {
                label: "En attente", value: stats.pending,
                sub: stats.pending > 0 ? "À traiter" : "Tout est traité ✓",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                color: stats.pending > 0 ? "bg-yellow-50 text-yellow-600" : "bg-emerald-50 text-emerald-600",
                href: "/admin/orders",
              },
              {
                label: "Produits", value: stats.products,
                sub: "dans le catalogue",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
                color: "bg-purple-50 text-purple-600", href: "/admin/products",
              },
            ].map((c) => (
              <Link key={c.label} href={c.href} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow group">
                <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}>{c.icon}</div>
                <p className="text-2xl font-black">{c.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{c.label}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{c.sub}</p>
              </Link>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
            {/* Revenue chart */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-sm">Revenus ({period} derniers jours)</h2>
                <span className="text-xs font-bold text-emerald-600">{totalPeriodRevenue.toLocaleString("fr-MA")} MAD</span>
              </div>
              <p className="text-xs text-neutral-400 mb-4">{totalPeriodOrders} commandes sur la période</p>
              {revenueData.every((v) => v === 0) ? (
                <div className="h-16 flex items-center justify-center text-neutral-300 text-xs">Pas encore de données</div>
              ) : (
                <div className="flex items-end gap-[3px] h-20">
                  {revenueData.map((v, i) => {
                    const maxV = Math.max(...revenueData, 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          style={{ height: `${Math.max(4, (v / maxV) * 100)}%`, background: v > 0 ? "#000" : "#e5e7eb" }}
                          className="w-full rounded-sm transition-all group-hover:opacity-70" />
                        {v > 0 && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {v.toFixed(0)} MAD
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-neutral-400">{dayStats[0]?.date ? new Date(dayStats[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
                <span className="text-[10px] text-neutral-400">Aujourd&apos;hui</span>
              </div>
            </div>

            {/* Order status breakdown */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <h2 className="font-bold text-sm mb-4">Statut des commandes</h2>
              <div className="space-y-3">
                {[
                  { label: "En attente", count: stats.pending, color: "bg-yellow-400" },
                  { label: "Livrées", count: stats.delivered, color: "bg-emerald-400" },
                  { label: "Annulées", count: stats.cancelled, color: "bg-red-400" },
                  { label: "Autres", count: stats.orders - stats.pending - stats.delivered - stats.cancelled, color: "bg-blue-400" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-xs text-neutral-600">{s.label}</span>
                      </div>
                      <span className="text-xs font-bold">{s.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color} transition-all`}
                        style={{ width: `${stats.orders > 0 ? (s.count / stats.orders) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Taux de livraison</span>
                  <span className="text-sm font-black text-emerald-600">
                    {stats.orders > 0 ? Math.round((stats.delivered / stats.orders) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders sparkbars */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-xs text-neutral-400 mb-1">Commandes / jour ({period}j)</p>
              <p className="text-xl font-black mb-3">{totalPeriodOrders}</p>
              <SparkBar data={ordersData7} color="#3B82F6" />
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-xs text-neutral-400 mb-1">Revenus / jour ({period}j)</p>
              <p className="text-xl font-black mb-3">{totalPeriodRevenue.toLocaleString("fr-MA")} MAD</p>
              <SparkBar data={revenueData} color="#10B981" />
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl border border-neutral-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-bold text-sm">Commandes récentes</h2>
              <Link href="/admin/orders" className="text-xs text-neutral-500 hover:text-black flex items-center gap-1">
                Voir tout <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center text-neutral-400 text-sm">Aucune commande pour l&apos;instant.</div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {recent.map((order) => (
                  <Link key={order.id} href={`/admin/orders?id=${order.id}`}
                    className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-neutral-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{order.customer?.name || "—"}</p>
                        <p className="text-sm font-bold shrink-0">{(order as { total: number }).total} MAD</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-neutral-400">#{order.order_number} · {new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${statusColors[order.status] || "bg-neutral-100 text-neutral-500"}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Nouveau produit", href: "/admin/products?new=1", icon: "+" },
              { label: "Voir commandes", href: "/admin/orders", icon: "\u2197" },
              { label: "G\u00e9rer le stock", href: "/admin/stock", icon: "\u26a1" },
              { label: "Zones livraison", href: "/admin/shipping", icon: "\ud83d\ude9a" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="bg-white rounded-xl border border-neutral-100 p-4 hover:border-black transition-colors flex items-center gap-3 active:scale-[0.98]">
                <span className="text-lg leading-none">{l.icon}</span>
                <span className="font-semibold text-sm">{l.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
