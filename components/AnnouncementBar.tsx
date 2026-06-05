const items = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    text: "LIVRAISON 35 MAD PARTOUT AU MAROC",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.35)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
      </svg>
    ),
    text: "RETOURS GRATUITS SOUS 30 JOURS",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.35)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    text: "PAIEMENT 100% SÉCURISÉ",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.35)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    text: "SERVICE CLIENT 7J/7",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.35)",
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    text: "NOUVEAUTÉS CHAQUE SEMAINE",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.35)",
  },
];

export default function AnnouncementBar() {
  const loop = [...items, ...items];
  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(90deg, #08080d 0%, #0f0f17 40%, #0f0f17 60%, #08080d 100%)",
      }}
    >
      {/* Colored shimmer line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #4ade80 0%, #60a5fa 25%, #a78bfa 50%, #fb923c 75%, #f472b6 100%)",
        opacity: 0.7,
      }} />

      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
        style={{ background: "linear-gradient(to right, #08080d, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
        style={{ background: "linear-gradient(to left, #08080d, transparent)" }} />

      <div className="marquee-track py-[10px] text-[11px] tracking-[0.18em] font-semibold">
        {loop.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 text-white/75 hover:text-white transition-colors duration-300 cursor-default">
            {/* Icon with coloured glow dot behind */}
            <span
              className="relative inline-flex items-center justify-center w-[22px] h-[22px] rounded-full shrink-0"
              style={{ background: item.glow }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
            </span>
            <span className="tracking-[0.16em]">{item.text}</span>
            {/* Diamond separator */}
            <span className="mx-4 shrink-0 text-white/20 text-[8px]">◆</span>
          </span>
        ))}
      </div>

      {/* Subtle bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

