import Link from "next/link";

export const metadata = {
  title: "À Propos | L'ecomax — Fondée à Sidi Bennour",
  description: "L'ecomax est une marque marocaine née à Sidi Bennour en 2026. Mode, sneakers et accessoires tech à prix juste.",
};

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-10">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">À Propos</span>
          </nav>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3ecf4c] mb-5">
            Fondée en 2026 · Sidi Bennour, Maroc
          </p>
          <h1 className="font-black text-5xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-none mb-7">
            L&apos;ecomax<br />
            <span className="text-[#3ecf4c]">c&apos;est quoi ?</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
            Une jeune marque marocaine née de la passion du style et du mouvement.
            On est là pour vous habiller — simplement, bien, et à prix juste.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#3ecf4c]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-8 items-center justify-center sm:justify-start">
          {[
            { value: "2026", label: "Année de création" },
            { value: "Sidi Bennour", label: "Origine" },
            { value: "30+", label: "Modèles" },
            { value: "7j/7", label: "Support client" },
          ].map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-black text-black text-[15px]">{s.value}</p>
              <p className="text-black/60 text-[11px] uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 space-y-20">

        {/* Story */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Notre histoire</p>
            <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight mb-6">
              Tout commence<br />par une idée simple
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              L&apos;ecomax est né à Sidi Bennour d&apos;un constat simple : il est difficile de trouver de bonnes sneakers
              et des vêtements de qualité à des prix raisonnables dans notre région.
              Alors on a décidé de le faire nous-mêmes.
            </p>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Fondée en 2026, notre boutique est la première étape d&apos;une aventure qui ne fait que commencer.
              Chaque produit est soigneusement sélectionné pour sa durabilité, son confort et son style.
            </p>
            <Link
              href="/boutiques/"
              className="inline-flex items-center gap-2 bg-black text-white font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
            >
              Voir notre boutique →
            </Link>
          </div>
          <div className="relative bg-neutral-950 rounded-3xl aspect-square flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3ecf4c]/20 to-black" />
            <span className="font-black text-[160px] text-white/5 select-none relative z-10 leading-none">L</span>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Est. 2026</p>
              <p className="text-[#3ecf4c] text-xs uppercase tracking-widest font-bold">Sidi Bennour</p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Ce qu&apos;on défend</p>
            <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight">Nos valeurs</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                emoji: "✅",
                title: "Authenticité",
                desc: "Uniquement des produits authentiques garantis d'origine. Zéro compromis sur la qualité.",
              },
              {
                emoji: "💰",
                title: "Prix justes",
                desc: "La qualité ne devrait pas être réservée à une élite. Nos prix sont pensés pour être accessibles à tous.",
              },
              {
                emoji: "❤️",
                title: "Service humain",
                desc: "Une vraie équipe derrière chaque commande. On répond, on résout, on s'améliore chaque jour.",
              },
            ].map((v) => (
              <div key={v.title} className="border border-neutral-100 rounded-2xl p-8 hover:border-[#3ecf4c] transition-colors group text-center">
                <span className="text-4xl">{v.emoji}</span>
                <h3 className="font-black text-[16px] uppercase tracking-tight mt-4 mb-2">{v.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-neutral-50 rounded-3xl p-10 sm:p-14">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-10 text-center">Où on en est</p>
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "2026", label: "Année de création" },
              { value: "30+", label: "Modèles sélectionnés" },
              { value: "1", label: "Boutique à Sidi Bennour" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-black text-4xl sm:text-5xl text-black">{stat.value}</p>
                <div className="w-8 h-0.5 bg-[#3ecf4c] mx-auto my-2" />
                <p className="text-neutral-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team / CTA */}
        <div className="rounded-2xl bg-neutral-950 text-white p-10 sm:p-14 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-4">L&apos;équipe</p>
          <h2 className="font-black text-3xl sm:text-4xl uppercase tracking-tight mb-4">
            On est juste au début.
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xl mx-auto mb-10">
            L&apos;ecomax grandit avec vous. Retrouvez-nous en boutique à Sidi Bennour ou contactez-nous directement.
            On est toujours à l&apos;écoute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/212699289568"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-black text-[12px] uppercase tracking-widest px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href="mailto:contact@lecomax.com"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-black text-[12px] uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              contact@lecomax.com
            </a>
            <Link
              href="/carrieres/"
              className="inline-flex items-center justify-center gap-2 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-[#32b83d] transition-colors"
            >
              Rejoindre l&apos;équipe →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
