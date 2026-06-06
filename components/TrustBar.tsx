"use client";

const badges = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="22" height="18" rx="2" />
        <path d="M1 9h22" />
      </svg>
    ),
    label: "Paiement à la livraison",
    sub: "100% sécurisé",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
        <rect x="9" y="11" width="14" height="10" rx="1" />
        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    label: "Livraison 35 MAD",
    sub: "Partout au Maroc",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
      </svg>
    ),
    label: "Retours 30 jours",
    sub: "Échanges gratuits",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "Achats sécurisés",
    sub: "Données protégées",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "Support 7j/7",
    sub: "Via WhatsApp",
  },
];

export default function TrustBar() {
  return (
    <div className="bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-neutral-800">
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-3 px-4 py-4 sm:py-5 group"
            >
              <div className="text-[#3ecf4c] shrink-0">{b.icon}</div>
              <div className="min-w-0">
                <p className="font-black text-[11px] uppercase tracking-widest text-white leading-tight">{b.label}</p>
                <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
