"use client";

type MapSession = {
  session_id: string;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  started_at: string;
  ended_at: string;
  page_count: number;
  device_type: string | null;
  browser: string | null;
  pages: { path: string; created_at: string }[];
};

type Props = { sessions: MapSession[]; period: number };

type CityPoint = {
  key: string;
  name: string;
  region: string | null;
  latitude: number;
  longitude: number;
  visits: number;
  live: number;
  lastSeen: string;
  pageCount: number;
};

const BOUNDS = { left: -17.2, right: -0.8, top: 36.15, bottom: 20.65 };

const REFERENCE_CITIES = [
  { name: "Tanger", latitude: 35.7595, longitude: -5.834 },
  { name: "Rabat", latitude: 34.0209, longitude: -6.8416 },
  { name: "Casablanca", latitude: 33.5731, longitude: -7.5898 },
  { name: "Fès", latitude: 34.0181, longitude: -5.0078 },
  { name: "Marrakech", latitude: 31.6295, longitude: -7.9811 },
  { name: "Agadir", latitude: 30.4278, longitude: -9.5981 },
  { name: "Laâyoune", latitude: 27.1253, longitude: -13.1625 },
  { name: "Dakhla", latitude: 23.6848, longitude: -15.958 },
];

function project(latitude: number, longitude: number) {
  return {
    left: `${((longitude - BOUNDS.left) / (BOUNDS.right - BOUNDS.left)) * 100}%`,
    top: `${((BOUNDS.top - latitude) / (BOUNDS.top - BOUNDS.bottom)) * 100}%`,
  };
}

function relativeTime(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `il y a ${Math.floor(seconds / 3600)} h`;
  return `il y a ${Math.floor(seconds / 86_400)} j`;
}

export default function MoroccoLiveMap({ sessions, period }: Props) {
  const activeSince = Date.now() - 5 * 60_000;
  const moroccoSessions = sessions.filter((session) =>
    session.country_code === "MA" &&
    typeof session.latitude === "number" &&
    typeof session.longitude === "number" &&
    session.latitude <= BOUNDS.top && session.latitude >= BOUNDS.bottom &&
    session.longitude >= BOUNDS.left && session.longitude <= BOUNDS.right
  );

  const grouped = new Map<string, CityPoint>();
  for (const session of moroccoSessions) {
    const name = session.city?.trim() || "Ville inconnue";
    const key = `${name.toLocaleLowerCase("fr")}-${session.region || ""}`;
    const existing = grouped.get(key);
    const isLive = new Date(session.ended_at).getTime() >= activeSince;
    if (!existing) {
      grouped.set(key, {
        key, name, region: session.region, latitude: session.latitude!, longitude: session.longitude!,
        visits: 1, live: isLive ? 1 : 0, lastSeen: session.ended_at, pageCount: session.page_count,
      });
    } else {
      const nextCount = existing.visits + 1;
      existing.latitude = (existing.latitude * existing.visits + session.latitude!) / nextCount;
      existing.longitude = (existing.longitude * existing.visits + session.longitude!) / nextCount;
      existing.visits = nextCount;
      existing.live += isLive ? 1 : 0;
      existing.pageCount += session.page_count;
      if (session.ended_at > existing.lastSeen) existing.lastSeen = session.ended_at;
    }
  }
  const cities = [...grouped.values()].sort((a, b) => b.live - a.live || b.visits - a.visits);
  const liveCities = cities.filter((city) => city.live > 0);
  const liveVisitors = liveCities.reduce((sum, city) => sum + city.live, 0);
  const mapCities = liveCities.length ? cities : cities.slice(0, 12);

  return (
    <section className="relative mb-4 overflow-hidden rounded-[20px] border border-black/80 bg-[#080b09] text-white shadow-[0_18px_55px_rgba(0,0,0,.15)] sm:mb-5 sm:rounded-[28px] sm:shadow-[0_24px_80px_rgba(0,0,0,.16)]">
      <div className="pointer-events-none absolute inset-0 opacity-[.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#3ecf4c]/10 blur-[100px]" />

      <header className="relative flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3ecf4c]/20 bg-[#3ecf4c]/10 text-lg sm:h-11 sm:w-11 sm:rounded-2xl sm:text-xl">🇲🇦</span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5 sm:gap-2"><h2 className="text-sm font-black leading-tight tracking-tight sm:text-lg">Maroc · activité en temps réel</h2><span className="flex items-center gap-1.5 rounded-full border border-[#3ecf4c]/20 bg-[#3ecf4c]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#66e875] sm:text-[9px]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ecf4c]" />Live</span></div><p className="mt-1 text-[9px] leading-4 text-white/40 sm:text-[11px]">Position approximative par ville · actualisation automatique</p></div>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          <MapMetric value={liveVisitors} label="En ligne" active />
          <MapMetric value={cities.length} label="Villes" />
          <MapMetric value={moroccoSessions.length} label={`${period} jours`} />
        </div>
      </header>

      <div className="relative grid lg:grid-cols-[minmax(480px,1.35fr)_minmax(300px,.65fr)]">
        <div className="relative flex min-h-[410px] items-center overflow-hidden border-b border-white/10 px-3 pb-4 pt-16 sm:min-h-[570px] sm:p-7 lg:border-b-0 lg:border-r">
          <div className="absolute left-4 top-4 z-20 rounded-lg border border-white/10 bg-black/50 px-2.5 py-2 backdrop-blur-md sm:left-7 sm:top-6 sm:rounded-xl sm:px-3"><p className="text-[8px] font-black uppercase tracking-[.16em] text-white/35 sm:text-[9px]">Couverture</p><p className="mt-1 text-[10px] font-bold sm:text-xs">Tout le Royaume</p></div>
          <div className="relative mx-auto aspect-[512/549] w-full max-w-[480px]">
            <img src="/images/morocco-full-map.svg" alt="Carte du Maroc" className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain opacity-[.18] grayscale brightness-[2.6] contrast-75" />
            {REFERENCE_CITIES.map((city) => <div key={city.name} className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2" style={project(city.latitude, city.longitude)}><span className="block h-1 w-1 rounded-full bg-white/30"/><span className="absolute left-2 top-1/2 hidden -translate-y-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-wider text-white/20 sm:block">{city.name}</span></div>)}
            {mapCities.map((city) => {
              const position = project(city.latitude, city.longitude);
              const isLive = city.live > 0;
              const size = Math.min(22, 10 + Math.log2(city.visits + 1) * 3);
              return <button key={city.key} type="button" className="group absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66e875]" style={position} title={`${city.name}: ${city.live} en ligne, ${city.visits} visites`}>
                {isLive && <span className="absolute left-1/2 top-1/2 animate-ping rounded-full bg-[#3ecf4c]/60" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }} />}
                <span className={`relative flex items-center justify-center rounded-full border-2 border-black shadow-[0_0_24px_rgba(62,207,76,.65)] ${isLive ? "bg-[#3ecf4c]" : "bg-violet-400"}`} style={{ width: size, height: size }}><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>
                <span className="pointer-events-none absolute bottom-[calc(100%+5px)] left-1/2 hidden w-max max-w-[180px] -translate-x-1/2 rounded-xl border border-white/10 bg-black/95 px-3 py-2 text-left shadow-2xl backdrop-blur-md group-hover:block group-focus:block"><strong className="block truncate text-[11px]">{city.name}</strong><span className="mt-0.5 block text-[9px] text-white/45">{city.live ? `${city.live} en ligne · ` : ""}{city.visits} visite{city.visits > 1 ? "s" : ""}</span></span>
              </button>;
            })}
          </div>
          {!cities.length && <div className="absolute bottom-4 left-1/2 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-xl border border-white/10 bg-black/65 p-3 text-center backdrop-blur-md sm:bottom-7 sm:rounded-2xl sm:p-4"><p className="text-[11px] font-bold sm:text-xs">En attente de visites géolocalisées</p><p className="mt-1 text-[9px] leading-4 text-white/40 sm:text-[10px]">Les prochains visiteurs du site en production apparaîtront automatiquement sur la carte.</p></div>}
        </div>

        <aside className="relative flex flex-col lg:min-h-[570px]">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/35">Villes actives</p><p className="mt-1 text-xs text-white/60">Classement sur {period} jours</p></div><span className="rounded-lg bg-white/[.06] px-2.5 py-1.5 text-[10px] font-black text-white/60">{cities.length}</span></div></div>
          <div className="max-h-[280px] flex-1 divide-y divide-white/[.06] overflow-y-auto sm:max-h-[360px]">
            {cities.length ? cities.slice(0, 12).map((city, index) => <div key={city.key} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[.035] sm:px-6"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.04] text-[10px] font-black text-white/30">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-bold">{city.name}</p>{city.live > 0 && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ecf4c]" />}</div><p className="mt-1 truncate text-[9px] text-white/30">{city.region || "Maroc"} · {relativeTime(city.lastSeen)}</p></div><div className="text-right"><p className={`text-sm font-black ${city.live ? "text-[#66e875]" : "text-white"}`}>{city.live || city.visits}</p><p className="text-[8px] font-bold uppercase tracking-wider text-white/25">{city.live ? "live" : "visites"}</p></div></div>) : <div className="flex h-52 flex-col items-center justify-center px-8 text-center"><span className="mb-3 text-2xl opacity-40">⌖</span><p className="text-xs font-bold text-white/60">Aucune ville détectée</p><p className="mt-1 text-[10px] leading-4 text-white/30">La géolocalisation est disponible pour les visites Vercel, pas pour localhost.</p></div>}
          </div>
          <div className="mt-auto border-t border-white/10 p-4 sm:p-6"><div className="rounded-xl border border-white/[.08] bg-white/[.035] p-3.5 sm:rounded-2xl sm:p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/45 sm:text-[10px]">Précision des données</span><span className="text-[8px] font-black text-[#66e875] sm:text-[9px]">NIVEAU VILLE</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#209b32] to-[#66e875]" /></div><p className="mt-3 text-[8px] leading-4 text-white/25 sm:text-[9px]">La position indique la ville estimée par le réseau. Elle ne représente jamais l’adresse exacte du client.</p></div></div>
        </aside>
      </div>
    </section>
  );
}

function MapMetric({ value, label, active = false }: { value: number; label: string; active?: boolean }) {
  return <div className="min-w-0 rounded-xl border border-white/10 bg-white/[.04] px-2 py-2 text-center sm:min-w-[70px] sm:px-3"><p className={`text-sm font-black sm:text-base ${active ? "text-[#66e875]" : "text-white"}`}>{value}</p><p className="mt-0.5 truncate text-[7px] font-bold uppercase tracking-wider text-white/30 sm:text-[8px]">{label}</p></div>;
}
