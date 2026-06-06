import Link from "next/link";

export const metadata = {
  title: "Carrières | L'ecomax",
  description: "Rejoignez l'équipe L'ecomax à Sidi Bennour et contribuez à l'avenir du retail au Maroc.",
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

export default function CarrieresPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Carrières</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Rejoignez-nous
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Construisez<br />
            <span className="text-[#3ecf4c]">l&apos;avenir</span><br />
            avec nous
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            Nous bâtissons l&apos;avenir du retail au Maroc depuis Sidi Bennour.
            Rejoignez une équipe passionnée, ambitieuse et soudée.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#3ecf4c]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-8 items-center justify-center sm:justify-start">
          {[
            { value: "2026", label: "Fondée" },
            { value: "Sidi Bennour", label: "Siège" },
            { value: "4 postes", label: "Ouverts maintenant" },
            { value: "100%", label: "Made in Morocco" },
          ].map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-black text-black text-[15px]">{s.value}</p>
              <p className="text-black/60 text-[11px] uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
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
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Postes ouverts</p>
          <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-8">Rejoignez l&apos;équipe</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.title} className="border border-neutral-100 rounded-2xl p-7 hover:border-neutral-200 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${deptColors[job.dept] || "bg-neutral-100 text-neutral-500"}`}>
                        {job.dept}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 border border-neutral-100 px-2.5 py-1 rounded-full">
                        {job.type}
                      </span>
                    </div>
                    <h3 className="font-black text-xl">{job.title}</h3>
                    <p className="text-neutral-500 text-sm mt-1">📍 {job.location}</p>
                  </div>
                  <a
                    href={`mailto:contact@lecomax.com?subject=Candidature – ${encodeURIComponent(job.title)}`}
                    className="shrink-0 bg-black text-white font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors"
                  >
                    Postuler →
                  </a>
                </div>
                <p className="text-[14px] text-neutral-600 leading-relaxed mb-4">{job.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="text-[11px] font-semibold bg-neutral-50 border border-neutral-100 text-neutral-500 px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
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
