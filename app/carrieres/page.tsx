import Link from "next/link";
import Image from "next/image";
import JobApplyButton from "@/components/JobApplyButton";

export const metadata = {
  title: "Carrières | L'ecomax",
  description: "Rejoignez l'équipe L'ecomax à Sidi Bennour et contribuez à l'avenir du retail au Maroc.",
  alternates: { canonical: "/carrieres/" },
};

const values = [
  { icon: "🌱", title: "Impact réel", desc: "Chaque action compte. Nous construisons quelque chose de concret au Maroc." },
  { icon: "🚀", title: "Croissance rapide", desc: "Une startup en pleine expansion — votre évolution de carrière aussi." },
  { icon: "🤝", title: "Équipe soudée", desc: "Petite équipe, grande ambition. Ici, chaque voix est entendue." },
  { icon: "🏡", title: "Flexibilité", desc: "Télétravail partiel pour certains postes. On fait confiance." },
];

const jobs = [
  {
    title: "Responsable Marketing Digital",
    location: "Sidi Bennour",
    type: "CDI",
    dept: "Marketing",
    desc: "Gérer et développer notre présence en ligne, créer des campagnes publicitaires percutantes et analyser les performances.",
    skills: ["Instagram Ads", "Google Ads", "Copywriting", "Analytics"],
  },
  {
    title: "Chargé(e) de la Relation Client",
    location: "Sidi Bennour",
    type: "CDI",
    dept: "Support",
    desc: "Accompagner nos clients par WhatsApp, email et téléphone. Résoudre les problèmes avec empathie et réactivité.",
    skills: ["WhatsApp Business", "Service client", "Arabe / Français", "Patience"],
  },
  {
    title: "Gestionnaire de Stock",
    location: "Sidi Bennour",
    type: "CDI",
    dept: "Logistique",
    desc: "Superviser la réception, le rangement et l'expédition des produits. Assurer la précision des inventaires.",
    skills: ["Gestion de stock", "Organisation", "Précision", "Rapidité"],
  },
  {
    title: "Développeur(se) Front-End",
    location: "Remote",
    type: "CDI / Freelance",
    dept: "Tech",
    desc: "Contribuer à l'amélioration continue de notre site e-commerce (React / Next.js). Passionné(e) par l'UX.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
];

const deptColors: Record<string, string> = {
  Marketing: "bg-purple-50 text-purple-700 border-purple-100",
  Support: "bg-blue-50 text-blue-700 border-blue-100",
  Logistique: "bg-orange-50 text-orange-700 border-orange-100",
  Tech: "bg-[#3ecf4c]/10 text-[#1a7d24] border-[#3ecf4c]/20",
};

const deptAccent: Record<string, string> = {
  Marketing: "border-l-purple-400",
  Support: "border-l-blue-400",
  Logistique: "border-l-orange-400",
  Tech: "border-l-[#3ecf4c]",
};

export default function CarrieresPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero — full-bleed bg on mobile, split on desktop */}
      <div className="relative bg-neutral-950 text-white overflow-hidden min-h-[520px] flex flex-col lg:flex-row">

        {/* Mobile: image as full background with dark overlay */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/images/pages/carrieres.png"
            alt="Boutique L'ecomax"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          {/* Dark overlay — lighter so photo shows through */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/50 to-neutral-950/75" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent" />
        </div>

        {/* Left: text */}
        <div className="relative z-10 w-full lg:w-[46%] shrink-0 px-6 sm:px-10 lg:px-14 py-16 flex flex-col justify-center">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-6">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Carrières</span>
          </nav>
          <span className="inline-flex w-fit text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full mb-5">
            Rejoignez-nous
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Construisez<br />
            <span className="text-[#3ecf4c]">l&apos;avenir</span><br />
            avec nous
          </h1>
          <p className="text-white/50 text-sm max-w-md leading-relaxed mb-8">
            Nous bâtissons l&apos;avenir du retail au Maroc depuis Sidi Bennour.
            Rejoignez une équipe passionnée, ambitieuse et soudée.
          </p>
          <a
            href="#postes"
            className="inline-flex items-center gap-2.5 w-fit bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-[#32b83d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Découvrir nos opportunités
          </a>
        </div>

        {/* Right: image — desktop only, bleeds to right edge */}
        <div className="hidden lg:block relative flex-1 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
          <div className="absolute top-8 right-8 z-20 bg-[#3ecf4c] text-black text-center rounded-2xl p-4 w-28 shadow-xl">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
            <p className="font-black text-[9px] uppercase tracking-wider leading-tight">Ensemble<br/>pour un<br/>avenir<br/>durable</p>
          </div>
          <Image
            src="/images/pages/carrieres.png"
            alt="Boutique L'ecomax"
            fill
            sizes="54vw"
            className="object-cover object-center"
            priority
          />
        </div>

      </div>

      {/* Stats bar */}
      <div className="bg-[#3ecf4c]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 sm:gap-x-0 sm:divide-x sm:divide-black/10">
          {[
            {
              value: "2026", label: "Fondée",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            },
            {
              value: "Sidi Bennour", label: "Siège",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            },
            {
              value: "4 postes", label: "Ouverts maintenant",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            },
            {
              value: "100%", label: "Made in Morocco",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 sm:px-8 ${i === 0 ? "sm:pl-0" : ""}`}>
              <span className="opacity-60 shrink-0">{s.icon}</span>
              <div>
                <p className="font-black text-black text-[14px] leading-tight">{s.value}</p>
                <p className="text-black/60 text-[10px] uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 space-y-16">

        {/* Values */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Notre culture</p>
          <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-8">Pourquoi L&apos;ecomax ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="border border-neutral-100 rounded-2xl p-6 hover:border-[#3ecf4c] transition-colors group">
                <span className="text-3xl">{v.icon}</span>
                <h3 className="font-black text-[15px] uppercase tracking-tight mt-3 mb-2">{v.title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Jobs */}
        <section id="postes">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Postes ouverts</p>
          <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-8">Rejoignez l&apos;équipe</h2>
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <div
                key={job.title}
                className={`border-l-[3px] border border-neutral-100 rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden ${deptAccent[job.dept] || "border-l-neutral-300"}`}
              >
                <div className="p-6 sm:p-8">
                  {/* Top: number + badges + button */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-neutral-300 tabular-nums w-5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${deptColors[job.dept] || "bg-neutral-100 text-neutral-500"}`}>
                        {job.dept}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 border border-neutral-100 px-2.5 py-1 rounded-full">
                        {job.type}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {job.location}
                      </span>
                    </div>
                    <JobApplyButton title={job.title} />
                  </div>

                  {/* Title + location on mobile */}
                  <h3 className="font-black text-xl sm:text-2xl tracking-tight mb-1">{job.title}</h3>
                  <p className="sm:hidden inline-flex items-center gap-1 text-[11px] text-neutral-400 mb-3">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {job.location}
                  </p>

                  {/* Desc */}
                  <p className="text-[13px] sm:text-[14px] text-neutral-500 leading-relaxed mb-5 max-w-2xl">{job.desc}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="text-[11px] font-medium bg-neutral-50 border border-neutral-100 text-neutral-500 px-3 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spontaneous */}
        <div className="rounded-2xl bg-neutral-950 text-white p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-2">Candidature spontanée</p>
            <p className="font-black text-2xl uppercase tracking-tight">Vous ne trouvez pas<br />votre poste ?</p>
            <p className="text-white/50 text-sm mt-2 max-w-sm">
              Envoyez-nous votre CV et une lettre de motivation. Nous lisons chaque candidature avec attention.
            </p>
          </div>
          <a
            href="mailto:contact@lecomax.com?subject=Candidature spontanée"
            className="shrink-0 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-8 py-4 rounded-full hover:bg-[#32b83d] transition-colors text-center"
          >
            Envoyer mon CV
          </a>
        </div>

      </div>
    </div>
  );
}
