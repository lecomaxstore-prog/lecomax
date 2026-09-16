"use client";

const CLARITY_PROJECT_ID = "x510dwwy6k";
const CLARITY_BASE = `https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}`;

const SECTIONS = [
  {
    id: "recordings",
    label: "Enregistrements",
    desc: "Regardez les sessions enregistrées de vos visiteurs en temps réel.",
    url: `${CLARITY_BASE}/recordings`,
    color: "from-blue-500 to-blue-400",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="none" />
      </svg>
    ),
  },
  {
    id: "heatmaps",
    label: "Heatmaps",
    desc: "Visualisez les zones les plus cliquées et scrollées de vos pages.",
    url: `${CLARITY_BASE}/heatmaps`,
    color: "from-orange-500 to-orange-400",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    desc: "Statistiques globales : sessions, pages vues, taux de rebond.",
    url: `${CLARITY_BASE}/dashboard`,
    color: "from-violet-500 to-violet-400",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" fill="white" stroke="none" />
        <rect x="14" y="3" width="7" height="7" fill="white" stroke="none" />
        <rect x="14" y="14" width="7" height="7" fill="white" stroke="none" />
        <rect x="3" y="14" width="7" height="7" fill="white" stroke="none" />
      </svg>
    ),
  },
  {
    id: "filters",
    label: "Filtres & Segments",
    desc: "Filtrez par appareil, pays, source de trafic ou comportement.",
    url: `${CLARITY_BASE}/recordings`,
    color: "from-emerald-500 to-emerald-400",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="white" stroke="none" />
      </svg>
    ),
  },
];

const TIPS = [
  { icon: "🎯", text: 'Filtrez par "Rage clicks" pour trouver les points de friction.' },
  { icon: "📱", text: "Comparez mobile vs desktop dans les heatmaps." },
  { icon: "🔁", text: "Cherchez les sessions avec beaucoup de scroll-back pour voir où les visiteurs hésitent." },
  { icon: "🛒", text: "Filtrez sur la page /checkout pour analyser les abandons de panier." },
];

export default function RecordingsPage() {
  return (
    <div className="flex flex-col bg-[#f4f4f2] min-h-full">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0078d4, #50d9ff)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
          </div>
          <div>
            <h1 className="font-black text-[15px] text-neutral-900 leading-none">Microsoft Clarity</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Enregistrements · Heatmaps · Comportement visiteurs</p>
          </div>
        </div>
        <a
          href={CLARITY_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078d4] text-white text-[12px] font-bold rounded-lg hover:bg-[#106ebe] transition-colors shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Ouvrir Clarity
        </a>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">
        {/* Notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-800">
          <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            Microsoft Clarity <strong>bloque l&apos;affichage dans les iframes</strong> pour des raisons de sécurité. Utilisez les boutons ci-dessous pour accéder directement à chaque section.
          </span>
        </div>

        {/* Quick access cards */}
        <div>
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Accès rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-neutral-100 p-4 hover:border-neutral-300 hover:shadow-md transition-all flex flex-col gap-3"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="font-bold text-[13px] text-neutral-900 leading-snug flex items-center gap-1.5">
                    {s.label}
                    <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Conseils d&apos;analyse</h2>
          <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 text-[13px]">
                <span className="text-base shrink-0">{tip.icon}</span>
                <span className="text-neutral-600">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project ID */}
        <div className="text-center">
          <p className="text-[11px] text-neutral-400">
            Projet Clarity : <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{CLARITY_PROJECT_ID}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
