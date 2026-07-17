import Link from "next/link";
import WhatsAppLink from "@/components/WhatsAppLink";

export const metadata = {
  title: "Retours & Échanges | L'ecomax",
  description: "Consultez la politique de retours et d'échanges L'ecomax : délai de 30 jours, étapes de retour et remboursement de vos commandes au Maroc.",
  alternates: { canonical: "/retours/" },
};

const steps = [
  {
    step: "01",
    title: "Connectez-vous",
    desc: "Accédez à votre compte et rendez-vous dans la section « Mes commandes ».",
  },
  {
    step: "02",
    title: "Sélectionnez l'article",
    desc: "Choisissez l'article à retourner et indiquez la raison du retour.",
  },
  {
    step: "03",
    title: "Envoyez le colis",
    desc: "Déposez l'article dans son emballage d'origine dans le bureau de poste le plus proche.",
  },
  {
    step: "04",
    title: "Remboursement",
    desc: "Dès réception et validation, votre remboursement est traité sous 5 à 7 jours ouvrés.",
  },
];

export default function RetoursPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative w-full bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(62,207,76,0.06) 0%, transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-16 lg:pt-20 lg:pb-28">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-10">
            <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/60">Retours &amp; Échanges</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-8 bg-[#3ecf4c]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3ecf4c]">Politique de retour</span>
              </div>
              <h1 className="font-black text-white leading-[1.02] mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)", letterSpacing: "-0.03em" }}>
                Retours &amp;<br />Échanges
              </h1>
              <p className="text-white/45 text-[15px] max-w-sm leading-relaxed">
                Votre satisfaction est notre priorité. Si un article ne vous convient pas, retournez-le facilement sous 30 jours.
              </p>
            </div>

            {/* stats card */}
            <div className="shrink-0 border border-white/10 bg-white/[0.04] px-6 py-5 lg:min-w-[220px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Garanties</p>
              <div className="space-y-2.5">
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Délai de retour</span>
                  <span className="text-[#3ecf4c] font-bold">30 jours</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Remboursement</span>
                  <span className="text-white font-bold">5–7 jours ouvrés</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Échange</span>
                  <span className="text-white font-bold">Taille / couleur</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Support</span>
                  <span className="text-white font-bold">7j/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 sm:h-20 lg:h-24 block">
            <path d="M0,45 C200,90 400,10 720,50 C1000,85 1250,15 1440,45 L1440,90 L0,90 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* ── Promise strip ── */}
      <div className="border-y border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-4 flex flex-wrap gap-8 items-center">
          {[
            { label: "30 jours pour retourner" },
            { label: "Remboursement garanti" },
            { label: "Échange taille / couleur" },
            { label: "Support 7j/7" },
          ].map((b, i) => (
            <div key={b.label} className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.12em] text-neutral-600">
              {i > 0 && <span className="hidden sm:block w-px h-3 bg-neutral-200" />}
              <span className="w-1.5 h-1.5 bg-[#3ecf4c] shrink-0" />
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-20 space-y-20">

        {/* Steps */}
        <section>
          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 01</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Comment initier un retour ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200">
            {steps.map((s) => (
              <div key={s.step} className="bg-white p-7 group hover:bg-neutral-950 transition-colors">
                <span className="font-black text-[2.5rem] leading-none text-neutral-100 group-hover:text-[#3ecf4c] transition-colors tabular-nums">{s.step}</span>
                <h3 className="font-black text-[14px] mt-4 mb-2 group-hover:text-white transition-colors">{s.title}</h3>
                <p className="text-[13px] text-neutral-500 group-hover:text-white/50 leading-relaxed transition-colors">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section>
          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 02</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Conditions d&apos;éligibilité</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-neutral-200">
            <div className="bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-6 bg-[#3ecf4c]" />
                <h3 className="font-black text-[13px] uppercase tracking-[0.15em]">Articles acceptés</h3>
              </div>
              <ul className="space-y-3">
                {["Article non porté et non lavé", "Étiquette d'origine attachée", "Emballage original intact", "Preuve d'achat (email de confirmation)"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-500 leading-relaxed">
                    <span className="mt-2.5 w-4 h-px bg-[#3ecf4c] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-6 bg-neutral-300" />
                <h3 className="font-black text-[13px] uppercase tracking-[0.15em] text-neutral-500">Articles refusés</h3>
              </div>
              <ul className="space-y-3">
                {["Articles portés ou lavés", "Articles sans étiquette", "Sous-vêtements et maillots de bain", "Articles en promotion finale", "Produits endommagés par l'utilisateur"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-500 leading-relaxed">
                    <span className="mt-2.5 w-4 h-px bg-neutral-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid sm:grid-cols-3 gap-px bg-neutral-200">
            {[
              { value: "30", unit: " jours", label: "Pour initier un retour", accent: true },
              { value: "5–7", unit: " jours", label: "Pour être remboursé", accent: false },
              { value: "100%", unit: "", label: "Remboursement garanti", accent: false },
            ].map((stat) => (
              <div key={stat.label} className="bg-white px-8 py-10 text-center">
                <p className="font-black leading-none mb-3" style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", letterSpacing: "-0.03em" }}>
                  <span className={stat.accent ? "text-[#3ecf4c]" : "text-black"}>{stat.value}</span>
                  {stat.unit && <span className="text-[1.2rem] text-neutral-300 font-black">{stat.unit}</span>}
                </p>
                <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-neutral-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exchanges */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 03</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Échanges</h2>
          </div>
          <p className="text-[14px] text-neutral-500 leading-[1.8] pl-[calc(2.75rem)] max-w-2xl">
            Vous souhaitez échanger votre article contre une autre taille ou couleur ? Effectuez un retour standard et passez une nouvelle commande. La livraison de votre nouvel achat est offerte.
          </p>
        </section>

        {/* CTA */}
        <div className="border-t-2 border-neutral-950 pt-10">
          <div className="bg-neutral-950 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3ecf4c] mb-2">Besoin d&apos;aide ?</p>
              <p className="font-black text-white text-[20px] leading-tight mb-1">On est là pour vous</p>
              <p className="text-white/40 text-[13px]">Notre équipe répond en moins de 2h, 7j/7.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <WhatsAppLink className="bg-[#25D366] text-white font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:opacity-90 transition-opacity text-center">
                WhatsApp
              </WhatsAppLink>
              <a
                href="mailto:contact@lecomax.com"
                className="bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:bg-[#32b83d] transition-colors text-center"
              >
                contact@lecomax.com
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
