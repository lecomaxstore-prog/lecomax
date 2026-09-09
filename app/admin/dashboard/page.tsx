"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { requestDashboard } from "@/lib/dashboard-request";

type DashboardStats = {
  products: number;
  orders: number;
  orderValue: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  lowStock: number;
};

type DayStat = {
  date: string;
  orderValue: number;
  orders: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
};

type DashboardPayload = {
  stats: DashboardStats;
  period: {
    days: 7 | 30;
    orderValue: number;
    orders: number;
    daily: DayStat[];
  };
  recentOrders: RecentOrder[];
  generatedAt: string;
  permissions: string[] | null;
};

type IconName =
  | "arrow"
  | "box"
  | "chart"
  | "check"
  | "chevron"
  | "clock"
  | "message"
  | "money"
  | "orders"
  | "plus"
  | "refresh"
  | "stock"
  | "truck";

const statusStyles: Record<string, { label: string; pill: string; dot: string }> = {
  pending: { label: "En attente", pill: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-400" },
  confirmed: { label: "Confirmée", pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  shipped: { label: "Expédiée", pill: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  delivered: { label: "Livrée", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Annulée", pill: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
};

const moneyFormatter = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("fr-FR");

function formatMoney(value: number) {
  return `${moneyFormatter.format(Number.isFinite(value) ? value : 0)} MAD`;
}

function formatDay(value: string, long = false) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", long
    ? { weekday: "short", day: "numeric", month: "short" }
    : { day: "2-digit", month: "short" });
}

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "money":
      return <svg {...common}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case "orders":
      return <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "box":
      return <svg {...common}><path d="M21 8l-9 5-9-5" /><path d="M3 8l9-5 9 5v8l-9 5-9-5z" /><path d="M12 13v8" /></svg>;
    case "stock":
      return <svg {...common}><path d="M4 19V9l8-5 8 5v10" /><path d="M8 19v-6h8v6M3 19h18" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "message":
      return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "chevron":
      return <svg {...common}><path d="M9 18l6-6-6-6" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /></svg>;
    case "check":
      return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>;
    case "truck":
      return <svg {...common}><path d="M10 17h4V5H2v12h3" /><path d="M14 9h4l4 4v4h-3" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" /></svg>;
  }
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Chargement du tableau de bord…</span>
      <div className="h-32 rounded-2xl bg-white motion-safe:animate-pulse" />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <div className="col-span-2 h-36 rounded-2xl bg-neutral-200 motion-safe:animate-pulse sm:h-40 lg:col-span-1" />
        {[0, 1, 2].map((item) => <div key={item} className="h-36 rounded-2xl bg-white motion-safe:animate-pulse sm:h-40" />)}
      </div>
      <div className="h-80 rounded-3xl bg-white motion-safe:animate-pulse" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  href,
  featured = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: IconName;
  href?: string;
  featured?: boolean;
}) {
  const featuredAmount = featured && value.endsWith(" MAD") ? value.slice(0, -4) : null;
  const classes = `group relative min-w-0 overflow-hidden rounded-2xl border p-3.5 transition-all active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] focus-visible:ring-offset-2 sm:p-5 ${
    featured
      ? "col-span-2 border-black bg-[#101512] text-white shadow-[0_18px_40px_rgba(15,23,18,0.16)] lg:col-span-1"
      : "border-neutral-200/80 bg-white text-neutral-950 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg"
  }`;

  const content = (
    <>
      {featured && <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#3ecf4c]/15 blur-3xl" />}
      <div className="relative flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-[#62e36e]" : "bg-neutral-100 text-neutral-700"}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        {href && <Icon name="arrow" className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${featured ? "text-white/35" : "text-neutral-300"}`} />}
      </div>
      <p className={`relative mt-4 text-[10px] font-extrabold uppercase tracking-[0.12em] sm:mt-5 sm:text-[11px] ${featured ? "text-white/45" : "text-neutral-400"}`}>{label}</p>
      <p data-metric-value className={`relative mt-1 min-w-0 font-black tabular-nums tracking-[-0.04em] ${featured ? "whitespace-nowrap text-[clamp(1.55rem,7vw,2.25rem)] lg:text-[1.75rem] xl:text-[2rem] 2xl:text-[2.25rem]" : "break-words text-2xl sm:text-3xl"}`}>
        {featuredAmount === null ? value : <>{featuredAmount}<span className="ml-1 text-[0.42em] tracking-normal text-[#62e36e]">MAD</span></>}
      </p>
      <p className={`relative mt-2 text-[11px] leading-4 sm:text-xs sm:leading-5 ${featured ? "text-white/55" : "text-neutral-500"}`}>{helper}</p>
    </>
  );

  return href
    ? <Link href={href} data-dashboard-metric={label} className={classes}>{content}</Link>
    : <div data-dashboard-metric={label} className={classes}>{content}</div>;
}

function RevenueChart({ daily, days, total }: { daily: DayStat[]; days: number; total: number }) {
  const width = 680;
  const height = 210;
  const left = 12;
  const right = 12;
  const top = 18;
  const bottom = 38;
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;
  const max = Math.max(...daily.map((item) => item.orderValue), 1);
  const points = daily.map((item, index) => ({
    ...item,
    x: daily.length <= 1 ? width / 2 : left + (index / (daily.length - 1)) * plotWidth,
    y: top + plotHeight - (item.orderValue / max) * plotHeight,
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = points.length > 0
    ? `${line} L${points[points.length - 1].x.toFixed(2)},${(top + plotHeight).toFixed(2)} L${points[0].x.toFixed(2)},${(top + plotHeight).toFixed(2)} Z`
    : "";
  const hasValues = daily.some((item) => item.orderValue > 0);
  const labelIndexes = Array.from(new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1])).filter((index) => index >= 0);

  return (
    <figure aria-labelledby="dashboard-revenue-title">
      {!hasValues ? (
        <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-neutral-300 shadow-sm"><Icon name="chart" /></span>
          <p className="mt-3 text-sm font-bold text-neutral-500">Aucune vente sur cette période</p>
          <p className="mt-1 text-xs text-neutral-400">Le graphique se remplira avec les prochaines commandes.</p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`Valeur des commandes sur ${days} jours : ${formatMoney(total)}`}
        >
          <title>{`Valeur quotidienne des commandes sur ${days} jours`}</title>
          <defs>
            <linearGradient id="dashboardRevenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ecf4c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3ecf4c" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((ratio) => {
            const y = top + plotHeight * ratio;
            return <line key={ratio} x1={left} x2={width - right} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 7" vectorEffect="non-scaling-stroke" />;
          })}
          <path d={area} fill="url(#dashboardRevenueArea)" />
          <path d={line} fill="none" stroke="#178b2d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {points.map((point) => (
            <circle key={point.date} cx={point.x} cy={point.y} r={point.orderValue > 0 ? 4 : 2} fill={point.orderValue > 0 ? "#178b2d" : "#d1d5db"} stroke="white" strokeWidth="2">
              <title>{`${formatDay(point.date, true)} : ${formatMoney(point.orderValue)}, ${point.orders} commande${point.orders > 1 ? "s" : ""}`}</title>
            </circle>
          ))}
          {labelIndexes.map((index) => {
            const point = points[index];
            if (!point) return null;
            return <text key={point.date} x={point.x} y={height - 8} textAnchor={index === 0 ? "start" : index === daily.length - 1 ? "end" : "middle"} fill="#9ca3af" fontSize="12">{formatDay(point.date)}</text>;
          })}
        </svg>
      )}

      {daily.length > 0 && (
        <details className="mt-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 text-xs">
          <summary className="cursor-pointer rounded-2xl px-4 py-3 font-bold text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">Voir les détails journaliers</summary>
          <div className="max-h-64 overflow-auto border-t border-neutral-100 px-4 py-2">
            <table className="w-full text-left">
              <caption className="sr-only">Valeur et nombre de commandes par jour</caption>
              <thead className="sticky top-0 bg-neutral-50 text-neutral-400"><tr><th className="py-2 font-semibold">Jour</th><th className="py-2 text-right font-semibold">Commandes</th><th className="py-2 text-right font-semibold">Valeur</th></tr></thead>
              <tbody>{daily.map((item) => <tr key={item.date} className="border-t border-neutral-100"><td className="py-2 text-neutral-600">{formatDay(item.date, true)}</td><td className="py-2 text-right font-bold tabular-nums">{item.orders}</td><td className="py-2 text-right font-bold tabular-nums">{formatMoney(item.orderValue)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

function StatusBreakdown({ stats }: { stats: DashboardStats }) {
  const statuses = [
    { key: "pending", label: "En attente", count: stats.pending, color: "bg-amber-400" },
    { key: "confirmed", label: "Confirmées", count: stats.confirmed, color: "bg-blue-500" },
    { key: "shipped", label: "Expédiées", count: stats.shipped, color: "bg-violet-500" },
    { key: "delivered", label: "Livrées", count: stats.delivered, color: "bg-emerald-500" },
    { key: "cancelled", label: "Annulées", count: stats.cancelled, color: "bg-red-400" },
  ];
  const completed = stats.delivered + stats.cancelled;
  const deliveryRate = completed > 0 ? Math.round((stats.delivered / completed) * 100) : 0;

  return (
    <div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-neutral-100"
        role="img"
        aria-label={statuses.map((item) => `${item.label} : ${item.count}`).join(", ")}
      >
        {statuses.map((item) => item.count > 0 && (
          <span key={item.key} className={item.color} style={{ width: `${(item.count / Math.max(stats.orders, 1)) * 100}%` }} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
        {statuses.map((item) => (
          <div key={item.key} className="flex min-w-0 items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-neutral-600"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} /><span className="truncate">{item.label}</span></span>
            <span className="font-black tabular-nums text-neutral-900">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
        <div><p className="text-xs font-bold text-emerald-900">Taux de livraison finalisé</p><p className="mt-0.5 text-[11px] text-emerald-700">Livrées parmi les commandes terminées</p></div>
        <span className="text-2xl font-black tabular-nums text-emerald-700">{deliveryRate}%</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const hasLoaded = useRef(false);
  const retryableError = useRef(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      if (hasLoaded.current) setRefreshing(true);
      else setLoading(true);
      setError(null);
      retryableError.current = true;

      try {
        const response = await requestDashboard(`/api/admin/dashboard?days=${period}`, controller.signal);
        if (!response.ok) {
          retryableError.current = response.status >= 500;
          if (response.status === 401) throw new Error("Votre session a expiré. Reconnectez-vous pour continuer.");
          if (response.status === 403) throw new Error("Votre compte ne dispose plus des autorisations nécessaires.");
          throw new Error("Impossible de charger les données du tableau de bord.");
        }
        const data = await response.json() as DashboardPayload;
        if (!data?.stats || !data?.period || !Array.isArray(data.recentOrders)) {
          throw new Error("La réponse du serveur est incomplète.");
        }
        setPayload(data);
        hasLoaded.current = true;
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Une erreur inattendue est survenue.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [period, retryToken]);

  // Recover an error left on screen after reconnecting or restarting the server.
  useEffect(() => {
    if (!error || !retryableError.current) return;
    const retry = () => {
      if (document.visibilityState === "visible" && navigator.onLine) setRetryToken(token => token + 1);
    };
    const timer = setTimeout(retry, 30_000);
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [error]);

  const can = (permission: string) => payload?.permissions === null || payload?.permissions.includes(permission) === true;
  const stats = payload?.stats;
  const periodData = payload?.period;
  const lastUpdate = payload?.generatedAt
    ? new Date(payload.generatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  const attentionItems = stats ? [
    can("orders.view") && stats.pending > 0 ? { label: "À confirmer", helper: "Commandes en attente", count: stats.pending, href: "/admin/orders?status=pending", icon: "clock" as IconName, tone: "bg-amber-50 text-amber-700 ring-amber-100" } : null,
    can("orders.view") && stats.confirmed > 0 ? { label: "À préparer", helper: "Commandes confirmées", count: stats.confirmed, href: "/admin/orders?status=confirmed", icon: "box" as IconName, tone: "bg-blue-50 text-blue-700 ring-blue-100" } : null,
    can("stock.edit") && stats.lowStock > 0 ? { label: "Stock faible", helper: "Produits à vérifier", count: stats.lowStock, href: "/admin/stock", icon: "stock" as IconName, tone: "bg-red-50 text-red-700 ring-red-100" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null) : [];

  const quickActions = payload ? [
    can("promotions.edit") ? { label: "Promotions", helper: "Gérer vos offres", href: "/admin/promotions", icon: "plus" as IconName, accent: "bg-emerald-50 text-emerald-700" } : null,
    can("banners.edit") ? { label: "Bannières", helper: "Animer l’accueil", href: "/admin/banners", icon: "box" as IconName, accent: "bg-neutral-100 text-neutral-700" } : null,
    can("products.view") ? { label: "Nouveau produit", helper: "Ajouter au catalogue", href: "/admin/products?new=1", icon: "plus" as IconName, accent: "bg-black text-white" } : null,
    can("orders.view") ? { label: "Commandes", helper: "Traiter et expédier", href: "/admin/orders", icon: "orders" as IconName, accent: "bg-orange-50 text-orange-700" } : null,
    can("stock.edit") ? { label: "Gérer le stock", helper: `${stats?.lowStock ?? 0} alerte${(stats?.lowStock ?? 0) > 1 ? "s" : ""}`, href: "/admin/stock", icon: "stock" as IconName, accent: "bg-violet-50 text-violet-700" } : null,
    can("messages.view") ? { label: "Messages", helper: "Répondre aux clients", href: "/admin/messages", icon: "message" as IconName, accent: "bg-blue-50 text-blue-700" } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null) : [];

  return (
    <div className="admin-dashboard mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-6">
      <header className="admin-dashboard-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">{todayLabel}</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-neutral-950 sm:text-3xl">Vue d’ensemble</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <span>{lastUpdate ? `Actualisé à ${lastUpdate}` : "Données de gestion en direct"}</span>
            {refreshing && <span role="status" className="inline-flex items-center gap-1.5 font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />Mise à jour…</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRetryToken((value) => value + 1)}
          disabled={refreshing || loading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 shadow-sm transition active:scale-[.99] hover:border-neutral-300 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] disabled:cursor-wait disabled:opacity-60 sm:min-h-11 sm:w-auto"
          aria-label="Actualiser les données du tableau de bord"
        >
          <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "motion-safe:animate-spin" : ""}`} />
          Actualiser
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Période d’analyse" className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
          {([7, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={`min-h-11 rounded-lg px-5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] ${period === value ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:text-black"}`}
            >
              {value} jours
            </button>
          ))}
        </div>
        {can("analytics.view") && <Link href="/admin/analytics" className="hidden min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-neutral-500 transition hover:bg-neutral-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] sm:inline-flex"><Icon name="chart" className="h-4 w-4" />Analyses détaillées<Icon name="arrow" className="h-4 w-4" /></Link>}
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-black">Les données n&apos;ont pas pu être actualisées.</p><p className="mt-1 text-xs leading-5 text-red-700">{error}{payload ? " Les dernières données valides restent affichées." : ""}</p></div>
          <button type="button" onClick={() => setRetryToken((value) => value + 1)} className="min-h-11 shrink-0 rounded-xl bg-red-700 px-4 font-bold text-white outline-none transition hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Réessayer</button>
        </div>
      )}

      {loading && !payload ? (
        <DashboardSkeleton />
      ) : !payload || !stats || !periodData ? (
        <div className="rounded-3xl border border-neutral-200 bg-white px-5 py-16 text-center"><p className="font-black text-neutral-800">Aucune donnée disponible</p><p className="mt-2 text-sm text-neutral-500">Utilisez le bouton Réessayer pour relancer le chargement.</p></div>
      ) : (
        <div aria-busy={refreshing} className={`space-y-5 transition-opacity sm:space-y-6 ${refreshing ? "opacity-70" : "opacity-100"}`}>
          <section aria-labelledby="attention-title" className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Priorités</p><h2 id="attention-title" className="mt-0.5 text-base font-black text-neutral-950">À traiter maintenant</h2></div>
              {attentionItems.length > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black tabular-nums text-red-700">{attentionItems.reduce((sum, item) => sum + item.count, 0)} action{attentionItems.reduce((sum, item) => sum + item.count, 0) > 1 ? "s" : ""}</span>}
            </div>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="check" /></span>
                <div><p className="text-sm font-black text-neutral-900">Tout est sous contrôle</p><p className="mt-0.5 text-xs leading-5 text-neutral-500">Aucune commande urgente ni alerte de stock visible pour votre rôle.</p></div>
              </div>
            ) : (
              <div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
                {attentionItems.map((item) => (
                  <Link key={item.href} href={item.href} className={`group flex min-h-[76px] items-center gap-3 rounded-xl p-3.5 ring-1 ring-inset transition active:scale-[.99] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] ${item.tone}`}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80"><Icon name={item.icon} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-black">{item.label}</span><span className="mt-0.5 block truncate text-xs opacity-75">{item.helper}</span></span>
                    <span className="text-2xl font-black tabular-nums">{item.count}</span>
                    <Icon name="chevron" className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Indicateurs principaux" className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <MetricCard
              label="Valeur des commandes"
              value={formatMoney(stats.orderValue)}
              helper={`${formatMoney(periodData.orderValue)} sur les ${periodData.days} derniers jours`}
              icon="money"
              href={can("orders.view") ? "/admin/orders" : undefined}
              featured
            />
            <MetricCard label="Commandes" value={numberFormatter.format(stats.orders)} helper={`${periodData.orders} sur les ${periodData.days} derniers jours`} icon="orders" href={can("orders.view") ? "/admin/orders" : undefined} />
            <MetricCard label="En attente" value={numberFormatter.format(stats.pending)} helper={stats.pending > 0 ? "À confirmer rapidement" : "Toutes les commandes sont traitées"} icon="clock" href={can("orders.view") ? "/admin/orders?status=pending" : undefined} />
            <MetricCard label="Catalogue" value={numberFormatter.format(stats.products)} helper={stats.lowStock > 0 ? `${stats.lowStock} produit${stats.lowStock > 1 ? "s" : ""} en stock faible` : "Aucune alerte de stock"} icon="box" href={can("products.view") ? "/admin/products" : undefined} />
          </section>

          {can("orders.view") && periodData.daily.length > 0 && (() => {
            const day = periodData.daily[periodData.daily.length - 1];
            return <section aria-label="Activité du jour" className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-sm font-bold">Aujourd’hui · Casablanca</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
                <div><p className="text-xs text-neutral-500">Valeur des commandes</p><p className="font-bold tabular-nums">{formatMoney(day.orderValue)}</p></div>
                <div><p className="text-xs text-neutral-500">Commandes</p><p className="font-bold tabular-nums">{day.orders}</p></div>
                <div><p className="text-xs text-neutral-500">Panier moyen</p><p className="font-bold tabular-nums">{formatMoney(day.orders ? day.orderValue / day.orders : 0)}</p></div>
              </div>
            </section>;
          })()}
          {quickActions.length > 0 && (
            <section aria-labelledby="quick-actions-title">
              <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Raccourcis</p><h2 id="quick-actions-title" className="mt-0.5 text-base font-black">Actions rapides</h2></div></div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href} className="admin-quick-action group flex min-h-[76px] min-w-0 items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-sm transition active:scale-[.99] hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] min-[440px]:min-h-[92px] sm:p-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.accent}`}><Icon name={action.icon} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-neutral-900">{action.label}</span><span className="mt-1 block text-xs leading-4 text-neutral-500">{action.helper}</span></span>
                    <Icon name="chevron" className="h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="recent-orders-title" className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Activité</p><h2 id="recent-orders-title" className="mt-0.5 text-base font-black">Commandes récentes</h2></div>
              {can("orders.view") && <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">Voir tout<Icon name="arrow" className="h-3.5 w-3.5" /></Link>}
            </div>
            {payload.recentOrders.length === 0 ? (
              <div className="px-5 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><Icon name="orders" /></span><p className="mt-4 text-sm font-black text-neutral-700">Aucune commande pour le moment</p><p className="mt-1 text-xs text-neutral-400">Les nouvelles commandes apparaîtront ici.</p></div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {payload.recentOrders.map((order) => {
                  const status = statusStyles[order.status] ?? { label: order.status || "Inconnu", pill: "bg-neutral-100 text-neutral-600 ring-neutral-200", dot: "bg-neutral-400" };
                  const row = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500"><Icon name="orders" className="h-[18px] w-[18px]" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-black text-neutral-900">{order.customerName || "Client"}</span><span className="shrink-0 text-[11px] font-bold text-neutral-400">#{order.orderNumber}</span></span>
                        <span className="mt-1 flex min-w-0 items-center gap-2"><time dateTime={order.createdAt} className="truncate text-xs text-neutral-400">{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</time><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ring-1 ring-inset ${status.pill}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span></span>
                      </span>
                      <span className="flex max-w-[92px] shrink-0 flex-col items-end gap-1 min-[430px]:max-w-none"><span className="text-right text-xs font-black tabular-nums text-neutral-950 min-[430px]:text-sm sm:text-base">{formatMoney(order.total)}</span><Icon name="chevron" className="h-4 w-4 text-neutral-300" /></span>
                    </>
                  );
                  return can("orders.view")
                    ? <Link key={order.id} href={`/admin/orders?id=${encodeURIComponent(order.id)}`} className="group flex min-h-[82px] items-center gap-3 px-4 py-3.5 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3ecf4c] sm:px-5">{row}</Link>
                    : <div key={order.id} className="flex min-h-[82px] items-center gap-3 px-4 py-3.5 sm:px-5">{row}</div>;
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="analytics-title">
            <h2 id="analytics-title" className="sr-only">Analyses de la période</h2>
            <button
              type="button"
              onClick={() => setShowAnalytics((value) => !value)}
              aria-expanded={showAnalytics}
              aria-controls="dashboard-analytics-panels"
              className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 text-left shadow-sm outline-none transition active:scale-[.99] hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-[#3ecf4c] lg:hidden"
            >
              <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="chart" /></span><span className="min-w-0"><span className="block text-sm font-black">Analyses de la période</span><span className="mt-0.5 block truncate text-xs text-neutral-500">{formatMoney(periodData.orderValue)} · {periodData.orders} commande{periodData.orders > 1 ? "s" : ""}</span></span></span>
              <Icon name="chevron" className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform ${showAnalytics ? "rotate-90" : ""}`} />
            </button>

            <div className="mb-3 hidden items-end justify-between lg:flex"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">Tendances</p><p className="mt-0.5 text-base font-black">Analyses de la période</p></div>{can("analytics.view") && <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black">Explorer les analyses<Icon name="arrow" className="h-3.5 w-3.5" /></Link>}</div>

            <div id="dashboard-analytics-panels" className={`${showAnalytics ? "mt-3 grid" : "hidden"} gap-4 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]`}>
              <article className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 id="dashboard-revenue-title" className="text-sm font-black text-neutral-900">Valeur quotidienne des commandes</h3><p className="mt-1 text-xs text-neutral-400">Les commandes annulées sont exclues.</p></div><div className="sm:text-right"><p className="text-xl font-black tabular-nums text-emerald-700">{formatMoney(periodData.orderValue)}</p><p className="text-[11px] text-neutral-400">sur {periodData.days} jours</p></div></div>
                <RevenueChart daily={periodData.daily} days={periodData.days} total={periodData.orderValue} />
              </article>
              <article className="rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5"><h3 className="text-sm font-black text-neutral-900">Cycle des commandes</h3><p className="mt-1 text-xs text-neutral-400">Répartition de toutes les commandes.</p></div><StatusBreakdown stats={stats} /></article>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
