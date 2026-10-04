"use client";
import ResponsiveTable from "@/components/admin/ResponsiveTable";
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
  ip_address: string | null;
  country: string | null;
  city: string | null;
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
type TopCountry = { country: string; sessions: number };

type DataSummary = {
  consents: ConsentRow[];
  total_consents: number;
  events: EventRow[];
  topPages: TopPage[];
  topProducts: TopProduct[];
  topCountries: TopCountry[];
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
const COUNTRY_NAMES: Record<string, string> = {
  MA: "Maroc", FR: "France", BE: "Belgique", DZ: "Alg\u00e9rie", TN: "Tunisie",
  ES: "Espagne", DE: "Allemagne", IT: "Italie", GB: "Royaume-Uni", US: "\u00c9tats-Unis",
  CA: "Canada", NL: "Pays-Bas", CH: "Suisse", PT: "Portugal", SE: "Su\u00e8de",
  NO: "Norv\u00e8ge", DK: "Danemark", AE: "\u00c9mirats arabes unis", SA: "Arabie saoudite",
  QA: "Qatar", SN: "S\u00e9n\u00e9gal", CI: "C\u00f4te d'Ivoire", CM: "Cameroun",
};

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "\uD83C\uDF0D";
  const a = code.toUpperCase().charCodeAt(0) - 65;
  const b = code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(0x1F1E6 + a) + String.fromCodePoint(0x1F1E6 + b);
}

function countryName(code: string | null): string {
  if (!code) return "Inconnu";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
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

  const events = data.events ?? [];
  const totalConsents = data.total_consents ?? 0;
  const topPages = data.topPages ?? [];
  const topProducts = data.topProducts ?? [];
  const topCountries = data.topCountries ?? [];
  const consents = data.consents ?? [];
  const totalEvents = events.length;
  const pageViews = events.filter(e => e.event_type === "page_view").length;
  const productViews = events.filter(e => e.event_type === "product_view").length;
  const cartAdds = events.filter(e => e.event_type === "cart_add").length;

  function downloadCSV(filename: string, rows: string[][]) {
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadEvents() {
    const headers = ["ID", "Session", "Type", "Chemin", "Titre", "Produit", "Categorie", "Recherche", "Date"];
    const rows = events.map(e => [
      e.id, e.session_id, e.event_type, e.path ?? "", e.title ?? "",
      e.product_name ?? "", e.category ?? "", e.query ?? "", e.created_at,
    ]);
    downloadCSV(`evenements-${new Date().toISOString().slice(0,10)}.csv`, [headers, ...rows]);
  }

  function downloadSessions() {
    const headers = ["ID", "Session", "Consentement", "Navigateur", "OS", "Langue", "Fuseau", "Source"];
    const rows = consents.map(c => [
      c.id, c.session_id, c.consented_at, c.browser ?? "", c.os ?? "",
      c.language ?? "", c.timezone ?? "", c.referrer ?? "",
    ]);
    downloadCSV(`sessions-${new Date().toISOString().slice(0,10)}.csv`, [headers, ...rows]);
  }

  const filteredEvents = events.filter(e => {
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
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-4 sm:p-6">

      {/* Header */}
      <div className="admin-mobile-heading admin-mobile-card-layout mb-4 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight sm:text-[1.4rem]">Données clients</h1>
          <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500 sm:text-sm">Collectées uniquement après consentement explicite</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            onClick={downloadEvents}
            disabled={events.length === 0}
            className="flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-[11px] font-bold transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Événements CSV
          </button>
          <button
            onClick={downloadSessions}
            disabled={consents.length === 0}
            className="flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-[11px] font-bold transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Sessions CSV
          </button>
          <span className="col-span-2 flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Conforme RGPD
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Sessions consenties", value: totalConsents, icon: "✅" },
          { label: "Pages vues", value: pageViews, icon: "👁️" },
          { label: "Produits consultés", value: productViews, icon: "🛍️" },
          { label: "Ajouts panier", value: cartAdds, icon: "🛒" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-5">
            <div aria-hidden="true" className="mb-1 text-lg sm:mb-2 sm:text-2xl">{icon}</div>
            <p className="break-words text-2xl font-black leading-tight tabular-nums sm:text-[1.6rem]">{(value ?? 0).toLocaleString("fr-FR")}</p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div aria-label="Sections des données clients" className="mb-4 grid w-full grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 sm:mb-5 sm:flex sm:w-fit">
        {(["overview", "events", "sessions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`min-h-11 min-w-0 rounded-lg px-1 py-2 text-[11px] font-bold transition-colors sm:px-4 sm:text-[12px] ${tab === t ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}
          >
            <span className="block sm:inline">{t === "overview" ? "Aperçu" : t === "events" ? "Événements" : "Sessions"}</span>
            {t !== "overview" && <span className="mt-0.5 block text-[10px] font-medium tabular-nums text-neutral-500 sm:ml-1 sm:mt-0 sm:inline">({(t === "events" ? totalEvents : totalConsents).toLocaleString("fr-FR")})</span>}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-2">
          {/* Top Countries */}
          <div className="min-w-0 rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-5">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Pays visiteurs</p>
            {topCountries.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucune donn\u00e9e</p>
            ) : (
              <div className="space-y-2">
                {topCountries.map(({ country, sessions }) => {
                  const maxSessions = topCountries[0].sessions;
                  return (
                    <div key={country}>
                      <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-[12px]">
                        <span className="flex min-w-0 items-center gap-1.5 font-medium text-neutral-700">
                          <span>{countryFlag(country)}</span>
                          <span className="truncate">{countryName(country)}</span>
                        </span>
                        <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 font-black tabular-nums text-neutral-900">{sessions.toLocaleString("fr-FR")}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3ecf4c] rounded-full"
                          style={{ width: `${(sessions / maxSessions) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="min-w-0 rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-5">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Pages les plus visitées</p>
            {topPages.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {topPages.map(({ path, views }) => {
                  const max = topPages[0].views;
                  return (
                    <div key={path}>
                      <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-[12px]">
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-700" title={path}>{path}</span>
                        <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 font-black tabular-nums text-neutral-900">{views.toLocaleString("fr-FR")}</span>
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
          <div className="min-w-0 rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-5">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Produits les plus consultés</p>
            {topProducts.length === 0 ? (
              <p className="text-neutral-400 text-sm">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map(({ id, name, category, views }) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-neutral-800 truncate">{name}</p>
                      <p className="break-words text-[10px] text-neutral-400 uppercase tracking-wider">{category}</p>
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
          <div className="min-w-0 rounded-2xl border border-neutral-100 bg-white p-3.5 sm:p-5 lg:col-span-2">
            <p className="font-black text-[13px] uppercase tracking-widest mb-4">Répartition des événements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(EVENT_LABELS).map(([type, { label, color }]) => {
                const count = events.filter(e => e.event_type === type).length;
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
              aria-label="Type d’événement"
              onChange={e => setFilterType(e.target.value)}
              className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base focus:border-black focus:outline-none sm:w-auto sm:text-xs"
            >
              <option value="all">Tous les événements</option>
              {Object.entries(EVENT_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              aria-label="Rechercher un événement"
              placeholder="Rechercher (URL, produit, session…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base focus:border-black focus:outline-none sm:text-xs"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full text-[12px]">
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
            </ResponsiveTable>
          </div>
        </div>
      )}

      {/* Tab: Sessions */}
      {tab === "sessions" && (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <ResponsiveTable className="w-full text-[12px]">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["Session", "IP", "Pays", "Ville", "Consentement", "Navigateur", "OS", "Langue", "Fuseau", "Source"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-bold text-neutral-500 uppercase tracking-widest text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consents.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-neutral-400">Aucune session consentie</td></tr>
                ) : (
                  consents.map(c => {
                    const evCount = events.filter(e => e.session_id === c.session_id).length;
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
                        <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-500 whitespace-nowrap">
                          {c.ip_address ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {c.country ? (
                            <span className="flex items-center gap-1.5">
                              <span>{countryFlag(c.country)}</span>
                              <span className="text-neutral-600 font-medium">{countryName(c.country)}</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">{c.city ?? "—"}</td>
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
            </ResponsiveTable>
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
  referrer text,
  ip_address text,
  country text,
  city text,
  latitude numeric,
  longitude numeric
);

-- If the table already exists, add the new columns:
ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS longitude numeric;

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
