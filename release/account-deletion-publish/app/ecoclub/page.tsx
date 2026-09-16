import Link from "next/link";

const perks = [
  {
    title: "Livraison gratuite permanente",
    desc: "Plus de minimum d'achat pour les membres ecoClub.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    title: "Points sur chaque achat",
    desc: "Gagnez 1 point pour chaque 10 MAD dépensés. Les points s'accumulent automatiquement.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    title: "Offres membres exclusives",
    desc: "Accédez à des ventes privées et réductions réservées aux membres ecoClub.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    title: "Accès anticipé",
    desc: "Soyez les premiers informés des nouvelles collections et des drops limités.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    title: "Cadeau d'anniversaire",
    desc: "Un bon de réduction surprise le jour de votre anniversaire.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="14" rx="1"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M12 8H7.5a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8z"/><path d="M12 8h4.5a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8z"/><line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    title: "Support prioritaire",
    desc: "Vos demandes sont traitées en priorité avec un délai de réponse garanti de 1h.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

const tiers = [
  {
    name: "Eco",
    points: "0 – 499 pts",
    color: "border-neutral-200",
    badge: "bg-neutral-100 text-neutral-700",
    perks: ["Points sur achats", "Offres membres", "Newsletter exclusive"],
  },
  {
    name: "Premium",
    points: "500 – 1999 pts",
    color: "border-black",
    badge: "bg-black text-white",
    featured: true,
    perks: ["Tout Eco +", "Livraison gratuite", "Accès anticipé", "Cadeau anniversaire"],
  },
  {
    name: "Elite",
    points: "2000+ pts",
    color: "border-neutral-800",
    badge: "bg-neutral-900 text-white",
    perks: ["Tout Premium +", "Support prioritaire", "Invitations événements", "Retours express"],
  },
];

export default function EcoClubPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">

      {/* Hero */}
      <div className="text-center mb-16">
        <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400 mb-3">Programme de fidélité</p>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.92]">
          L&apos;ecoClub
        </h1>
        <div className="w-12 h-[3px] bg-black mt-4 mb-5 mx-auto" />
        <p className="max-w-lg mx-auto text-neutral-500 text-[15px] leading-relaxed">
          Rejoignez le club et profitez d&apos;avantages exclusifs à chaque achat.
          Plus vous achetez, plus vous gagnez.
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center gap-2 mt-7 bg-black text-white px-8 py-4 font-black uppercase text-[13px] tracking-wider hover:bg-neutral-800 active:scale-95 transition-all"
        >
          Rejoindre gratuitement
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>

      {/* Perks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-16">
        {perks.map((p) => (
          <div
            key={p.title}
            className="group border border-neutral-200 p-6 hover:border-black hover:bg-neutral-50 transition-all"
          >
            <span className="text-neutral-600 group-hover:text-black transition-colors">
              {p.icon}
            </span>
            <h3 className="font-black text-[13px] uppercase tracking-wide mt-4 mb-1">{p.title}</h3>
            <p className="text-neutral-400 text-[12px] leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Tiers */}
      <div className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-2">
          Les niveaux ecoClub
        </h2>
        <div className="w-8 h-[3px] bg-black mx-auto mb-10" />
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`border-2 ${t.color} p-6 ${t.featured ? "md:-mt-4 md:-mb-4" : ""}`}
            >
              {t.featured && (
                <p className="text-[10px] uppercase tracking-widest text-center bg-black text-white py-1 -mx-6 -mt-6 mb-5 font-bold">
                  Le plus populaire
                </p>
              )}
              <span className={`inline-block text-[11px] font-black uppercase px-3 py-1 tracking-wider ${t.badge}`}>
                {t.name}
              </span>
              <p className="text-neutral-400 text-[12px] mt-2 mb-5">{t.points}</p>
              <ul className="space-y-2.5">
                {t.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-[13px]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-neutral-950 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-1">Prêt à rejoindre ?</h2>
          <p className="text-white/50 text-[14px]">L&apos;inscription est gratuite et immédiate.</p>
        </div>
        <Link
          href="/connexion"
          className="self-start md:self-auto inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 font-black uppercase text-[12px] tracking-wider hover:bg-neutral-100 transition-colors whitespace-nowrap"
        >
          Créer mon compte ecoClub
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>

    </div>
  );
}
