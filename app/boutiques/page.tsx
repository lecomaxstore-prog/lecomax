import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Notre Boutique — Sidi Bennour | L'ecomax",
  description: "Visitez L'ecomax en boutique à Sidi Bennour. Chaussures, vêtements et accessoires tech.",
};

export default function BoutiquesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-neutral-950 border-b border-white/5">
        {/* Background store photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/pages%20images/notre%20boutique%20image.png"
            alt="L'ecomax boutique"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500 mb-8">
            <Link href="/" className="hover:text-neutral-300 transition-colors">Accueil</Link>
            <span className="text-neutral-700">›</span>
            <span className="text-neutral-400">Notre Boutique</span>
          </nav>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3ecf4c] mb-4">
            Boutique physique · Sidi Bennour
          </p>
          <h1 className="h-display font-black text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] text-white uppercase tracking-tighter leading-[0.88] mb-6">
            Venez nous<br />
            <span className="text-[#3ecf4c]">rendre visite</span>
          </h1>
          <p className="text-neutral-400 text-[14px] max-w-lg leading-relaxed mb-10">
            L&apos;ecomax est né à Sidi Bennour. Venez découvrir notre sélection en personne — notre équipe est là pour vous conseiller.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/212699289568"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:bg-[#32b83d] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Nous contacter
            </a>
            <a
              href="https://maps.google.com/?q=Sidi+Bennour+Maroc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 border border-white/20 text-white font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:border-white/40 hover:bg-white/5 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Voir sur Maps
            </a>
          </div>
        </div>
      </div>

      {/* ── Info strip ───────────────────────────────────────── */}
      <div className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4">
          {[
            { value: "Sidi Bennour", label: "Localisation", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
            { value: "Lun – Dim", label: "7j / 7", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
            { value: "9h – 21h", label: "Horaires", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { value: "+212 699 289 568", label: "WhatsApp", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> },
          ].map((s, i, arr) => (
            <div key={s.label} className={`flex items-center gap-3 px-6 py-4 ${i < arr.length - 1 ? "border-r border-neutral-100" : ""}`}>
              <div className="w-7 h-7 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-500">
                {s.icon}
              </div>
              <div>
                <p className="font-black text-black text-[13px] leading-tight">{s.value}</p>
                <p className="text-neutral-400 text-[10px] uppercase tracking-[0.18em] mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">

        {/* Store photo + Info card */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0 mb-14 border border-neutral-100 overflow-hidden">

          {/* Map */}
          <div className="relative h-80 lg:h-auto min-h-[420px] bg-neutral-100 overflow-hidden">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-8.4559%2C32.6319%2C-8.4059%2C32.6681&layer=mapnik&marker=32.650%2C-8.431"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "420px" }}
              allowFullScreen
              loading="lazy"
              title="L'ecomax Sidi Bennour"
            />
            <a
              href="https://maps.google.com/?q=Sidi+Bennour+Maroc"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-white text-black text-[10px] font-black uppercase tracking-[0.18em] px-4 py-2.5 hover:bg-neutral-100 transition-colors shadow-md"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Ouvrir dans Maps ↗
            </a>
          </div>

          {/* Info */}
          <div className="border-t border-neutral-100 lg:border-t-0 lg:border-l flex flex-col">
            {/* Header */}
            <div className="px-7 pt-7 pb-6 border-b border-neutral-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-black text-white px-3 py-1">
                  Boutique principale
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#3ecf4c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
                  Ouvert
                </span>
              </div>
              <h2 className="h-display font-black text-[1.6rem] uppercase leading-tight">L&apos;ecomax</h2>
              <p className="text-neutral-400 text-[12px] mt-1">Sidi Bennour, Maroc — Fondée en 2026</p>
            </div>

            {/* Details */}
            <div className="px-7 py-6 flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-500 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.15em] text-neutral-500">Adresse</p>
                  <p className="text-[13px] text-neutral-700 mt-0.5 leading-snug">Sidi Bennour, Province de<br />Doukkala-Abda, Maroc</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-500 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.15em] text-neutral-500">Horaires</p>
                  <div className="text-[13px] mt-0.5 space-y-0.5">
                    <p className="text-neutral-500">Lun – Ven : <span className="text-black font-bold">9h00 – 21h00</span></p>
                    <p className="text-neutral-500">Samedi : <span className="text-black font-bold">9h00 – 22h00</span></p>
                    <p className="text-neutral-500">Dimanche : <span className="text-black font-bold">10h00 – 20h00</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-500 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.15em] text-neutral-500">Email</p>
                  <a href="mailto:contact@lecomax.com" className="text-[13px] text-neutral-700 hover:text-black transition-colors mt-0.5 block">contact@lecomax.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-500 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.15em] text-neutral-500">Téléphone</p>
                  <a href="tel:+212699289568" className="text-[13px] text-neutral-700 hover:text-black transition-colors mt-0.5 block font-semibold">+212 699 289 568</a>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="border-t border-neutral-100 grid grid-cols-2">
              <a
                href="https://wa.me/212699289568"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white text-[11px] font-black uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <Link
                href="/boutique"
                className="flex items-center justify-center py-4 bg-black text-white text-[11px] font-black uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors border-l border-white/10"
              >
                Nos produits
              </Link>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-0 border border-neutral-100 mb-14">
          {[
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
              title: "Sidi Bennour",
              desc: "Au cœur de la ville, facilement accessible à pied ou en voiture.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
              title: "Essayage en boutique",
              desc: "Essayez chaussures et vêtements avant d'acheter. Notre équipe vous guide.",
            },
            {
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10H3M16 2v4M8 2v4"/><rect x="3" y="4" width="18" height="18"/></svg>,
              title: "Click & Collect",
              desc: "Commandez en ligne et retirez gratuitement en boutique dès le lendemain.",
            },
          ].map((f, i) => (
            <div key={f.title} className={`p-8 group hover:bg-neutral-50 transition-colors ${i > 0 ? "border-t sm:border-t-0 sm:border-l border-neutral-100" : ""}`}>
              <div className="w-11 h-11 border border-neutral-200 bg-white group-hover:border-[#3ecf4c]/40 group-hover:bg-[#3ecf4c]/5 flex items-center justify-center text-neutral-500 group-hover:text-[#3ecf4c] mb-6 transition-all">
                {f.icon}
              </div>
              <h3 className="font-black text-[13px] uppercase tracking-[0.1em] mb-2">{f.title}</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="relative overflow-hidden bg-neutral-950 text-white">
          <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.06] blur-[80px] -translate-y-1/2 translate-x-1/4" style={{ background: "#3ecf4c" }} />
          <div className="relative px-8 sm:px-12 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3ecf4c] mb-2">Shopping en ligne</p>
              <p className="h-display font-black text-[1.8rem] uppercase leading-tight">Pas disponible<br />pour venir ?</p>
              <p className="text-neutral-400 text-[13px] mt-2">Commandez sur lecomax.com — livraison partout au Maroc.</p>
            </div>
            <Link
              href="/boutique"
              className="shrink-0 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.18em] px-8 py-4 hover:bg-[#32b83d] transition-colors inline-flex items-center gap-2.5"
            >
              Voir la boutique en ligne
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}