"use client";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConsentRow = {
  id: string;
  session_id: string;
  consented_at: string;
  browser: string | null;
  os: string | null;
  language: string | null;
  timezone: string | null;
  referrer: string | null;
};

type EventRow = {
  id: string;
  session_id: string;
  event_type: string;
  path: string | null;
  title: string | null;
  product_id: string | null;
  product_name: string | null;
  category: string | null;
  query: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
};

type TopPage = { path: string; views: number };
type TopProduct = { id: string; name: string; category: string; views: number };

type DataSummary = {
  consents: ConsentRow[];
  total_consents: number;
  events: EventRow[];
  topPages: TopPage[];
  topProducts: TopProduct[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  page_view: { label: "Page vue", color: "bg-blue-50 text-blue-700 border-blue-100" },
  product_view: { label: "Produit vu", color: "bg-purple-50 text-purple-700 border-purple-100" },
  cart_add: { label: "Ajout panier", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cart_remove: { label: "Retrait panier", color: "bg-red-50 text-red-700 border-red-100" },
  search: { label: "Recherche", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  checkout_start: { label: "Commande débutée", color: "bg-orange-50 text-orange-700 border-orange-100" },
  checkout_complete: { label: "Commande complète", color: "bg-green-50 text-green-700 border-green-100" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClientDataPage() {
  const [data, setData] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "events" | "sessions">("overview");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/client-data")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-neutral-400">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
        Chargement des données…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-5 py-4 text-sm">
          {error ?? "Aucune donnée disponible"}<br />
          <span className="text-[11px] text-red-400 mt-1 block">
            Assurez-vous que les tables Supabase ont été créées (voir SQL de migration ci-dessous).
          </span>
        </div>
        <SqlMigration />
      </div>
    );
  }

  const totalEvents = data.events.length;
  const pageViews = data.events.filter(e => e.event_type === "page_view").length;
  const productViews = data.events.filter(e => e.event_type === "product_view").length;
  const cartAdds = data.events.filter(e => e.event_type === "cart_add").length;

  const filteredEvents = data.events.filter(e => {
    if (filterType !== "all" && e.event_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (e.path ?? "").toLowerCase().includes(q) ||
        (e.product_name ?? "").toLowerCase().includes(q) ||
        (e.query ?? "").toLowerCase().includes(q) ||
        e.session_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.4rem] font-black tracking-tight">Données clients</h1>
          <p className="text-neutral-400 text-sm mt-0.5">Collectées uniquement après consentement explicite</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Conforme RGPD
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions consenties", value: data.total_consents, icon: "✅" },
          { label: "Pages vues", value: pageViews, icon: "👁️" },
          { label: "Produits consultés", value: productViews, icon: "🛍️" },
          { label: "Ajouts panier", value: cartAdds, icon: "🛒" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white border border-neutral-100 rounded-2xl p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-[1.6rem] font-black">{value.toLocaleString("fr-FR")}</p>
            <p className="text-[11px] text-neutral-400 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-neutral-100 rounded-xl p-1 w-fit">
        {(["overview", "events", "sessions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${tab === t ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}
          >
            {t === "overview" ? "Aperçu" : t === "events" ? `Événements (${totalEvents})` : `Sessions (${data.total_consents})`}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Top Pages */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-5">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Pages les plus visitées</p>
            {data.topPages.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {data.topPages.map(({ path, views }) => {
                  const max = data.topPages[0].views;
                  return (
                    <div key={path}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-neutral-700 font-medium truncate max-w-[70%]">{path}</span>
                        <span className="font-black text-neutral-900">{views}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3ecf4c] rounded-full"
                          style={{ width: `${(views / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-5">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Produits les plus consultés</p>
            {data.topProducts.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map(({ id, name, category, views }) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-neutral-800 truncate">{name}</p>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{category}</p>
                    </div>
                    <span className="text-[12px] font-black bg-neutral-100 px-2.5 py-1 rounded-lg shrink-0">
                      {views} vues
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event breakdown */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-5 lg:col-span-2">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Répartition des événements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(EVENT_LABELS).map(([type, { label, color }]) => {
                const count = data.events.filter(e => e.event_type === type).length;
                return (
                  <div key={type} className={`border rounded-xl px-4 py-3 text-center ${color}`}>
                    <p className="text-[1.4rem] font-black">{count}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Events */}
      {tab === "events" && (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black bg-neutral-50"
            >
              <option value="all">Tous les événements</option>
              {Object.entries(EVENT_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Rechercher (URL, produit, session…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black bg-neutral-50 flex-1 min-w-[180px]"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["Heure", "Type", "Détail", "Session"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-bold text-neutral-500 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-neutral-400">Aucun événement trouvé</td></tr>
                ) : (
                  filteredEvents.map(ev => {
                    const meta = EVENT_LABELS[ev.event_type] ?? { label: ev.event_type, color: "bg-neutral-50 text-neutral-600 border-neutral-100" };
                    const detail = ev.product_name
                      ? `${ev.product_name}${ev.category ? ` · ${ev.category}` : ""}`
                      : ev.query
                      ? `Recherche : "${ev.query}"`
                      : ev.path ?? "—";
                    return (
                      <tr key={ev.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap" title={fmt(ev.created_at)}>
                          {relativeTime(ev.created_at)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-700 max-w-[280px] truncate" title={detail}>
                          {detail}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-400 font-mono text-[10px]">
                          {ev.session_id.slice(0, 8)}…
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Sessions */}
      {tab === "sessions" && (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["Session", "Consentement", "Navigateur", "OS", "Langue", "Fuseau", "Source"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-bold text-neutral-500 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.consents.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-neutral-400">Aucune session consentie</td></tr>
                ) : (
                  data.consents.map(c => {
                    const evCount = data.events.filter(e => e.session_id === c.session_id).length;
                    return (
                      <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-[10px] text-neutral-500">{c.session_id.slice(0, 8)}…</span>
                          {evCount > 0 && (
                            <span className="ml-2 text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full font-bold">
                              {evCount} évén.
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap">{fmt(c.consented_at)}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.browser ?? "—"}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.os ?? "—"}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.language ?? "—"}</td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.timezone ?? "—"}</td>
                        <td className="px-4 py-2.5 text-neutral-400 max-w-[180px] truncate" title={c.referrer ?? ""}>
                          {c.referrer ? new URL(c.referrer, "http://x").hostname || c.referrer : "Direct"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL migration notice */}
      <SqlMigration />
    </div>
  );
}

// ─── SQL Migration block ──────────────────────────────────────────────────────

function SqlMigration() {
  const [open, setOpen] = useState(false);
  const sql = `-- Run this once in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/yddqwgdgeljkzfsmtein/sql/new

CREATE TABLE IF NOT EXISTS data_collection_consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  consented_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  browser text,
  os text,
  screen_width int,
  screen_height int,
  language text,
  timezone text,
  referrer text
);

CREATE TABLE IF NOT EXISTS client_behavioral_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  event_type text NOT NULL,
  path text,
  title text,
  product_id text,
  product_name text,
  category text,
  query text,
  extra jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbe_session ON client_behavioral_events (session_id);
CREATE INDEX IF NOT EXISTS idx_cbe_event_type ON client_behavioral_events (event_type);
CREATE INDEX IF NOT EXISTS idx_cbe_created_at ON client_behavioral_events (created_at DESC);`;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 hover:text-neutral-700 uppercase tracking-widest transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
        {open ? "Masquer" : "Afficher"} la migration SQL requise
      </button>
      {open && (
        <div className="mt-3 bg-neutral-900 rounded-2xl p-4 overflow-x-auto">
          <pre className="text-[11px] text-neutral-300 font-mono leading-relaxed whitespace-pre">{sql}</pre>
          <button
            onClick={() => navigator.clipboard.writeText(sql)}
            className="mt-3 text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Copier le SQL
          </button>
        </div>
      )}
    </div>
  );
}
