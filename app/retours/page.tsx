import Link from "next/link";

export const metadata = {
  title: "Retours & Échanges | L'ecomax",
  description: "Politique de retour L'ecomax — 30 jours, sans questions.",
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

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Retours & Échanges</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Politique de retour
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Retours &amp;<br />
            <span className="text-[#3ecf4c]">Échanges</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            Votre satisfaction est notre priorité. Si un article ne vous convient pas, retournez-le facilement.
          </p>
        </div>
      </div>

      {/* Promise banner */}
      <div className="bg-[#3ecf4c]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-6 items-center justify-center sm:justify-start">
          {[
            { icon: "📦", text: "30 jours pour retourner" },
            { icon: "✅", text: "Remboursement garanti" },
            { icon: "🔄", text: "Échange taille / couleur" },
            { icon: "📞", text: "Support 7j/7" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-black font-black text-[12px] uppercase tracking-wide">
              <span className="text-base">{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 space-y-16">

        {/* Steps */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Processus</p>
          <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-10">Comment initier un retour ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div key={s.step} className="border border-neutral-100 rounded-2xl p-6 hover:border-[#3ecf4c] transition-colors group">
                <span className="font-black text-4xl text-neutral-100 group-hover:text-[#3ecf4c] transition-colors">{s.step}</span>
                <h3 className="font-black text-[15px] mt-3 mb-2">{s.title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="border border-neutral-100 rounded-2xl p-8">
            <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-xl mb-4">✅</div>
            <h3 className="font-black text-lg uppercase tracking-tight mb-4">Articles éligibles</h3>
            <ul className="space-y-3">
              {["Article non porté et non lavé","Étiquette d'origine attachée","Emballage original intact","Preuve d'achat (email de confirmation)"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3ecf4c] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-neutral-100 rounded-2xl p-8">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl mb-4">❌</div>
            <h3 className="font-black text-lg uppercase tracking-tight mb-4">Articles non éligibles</h3>
            <ul className="space-y-3">
              {["Articles portés ou lavés","Articles sans étiquette","Sous-vêtements et maillots de bain","Articles en promotion finale","Produits endommagés par l'utilisateur"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Refund info */}
        <section className="bg-neutral-50 rounded-2xl p-8 sm:p-10">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "30", unit: "jours", label: "Pour initier un retour" },
              { value: "5–7", unit: "jours", label: "Pour être remboursé" },
              { value: "100%", unit: "", label: "Remboursement garanti" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-black text-5xl text-black">{stat.value}<span className="text-[#3ecf4c] text-3xl">{stat.unit}</span></p>
                <p className="text-[13px] text-neutral-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exchanges */}
        <section className="border border-neutral-100 rounded-2xl p-8">
          <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-xl mb-4">🔄</div>
          <h3 className="font-black text-lg uppercase tracking-tight mb-3">Échanges</h3>
          <p className="text-[14px] text-neutral-600 leading-relaxed max-w-xl">
            Vous souhaitez échanger votre article contre une autre taille ou couleur ? Effectuez un retour standard et passez une nouvelle commande. La livraison de votre nouvel achat est offerte.
          </p>
        </section>

        {/* Contact CTA */}
        <div className="rounded-2xl bg-neutral-950 text-white p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-1">Besoin d&apos;aide ?</p>
            <p className="font-black text-[20px]">On est là pour vous</p>
            <p className="text-white/50 text-sm mt-1">Notre équipe répond en moins de 2h, 7j/7.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="https://wa.me/212699289568" target="_blank" rel="noopener noreferrer"
              className="bg-[#25D366] text-white font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-center">
              WhatsApp
            </a>
            <a href="mailto:support@lecomax.com"
              className="bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#32b83d] transition-colors text-center">
              Email
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
