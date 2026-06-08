import Link from "next/link";
import WhatsAppLink from "@/components/WhatsAppLink";

export const metadata = {
  title: "Notre Boutique — Sidi Bennour | L'ecomax",
  description: "Visitez L'ecomax en boutique à Sidi Bennour. Chaussures, vêtements et accessoires tech.",
};

export default function BoutiquesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Notre Boutique</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Boutique physique
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Venez nous<br />
            <span className="text-[#3ecf4c]">rendre visite</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            L&apos;ecomax est né à Sidi Bennour. Venez découvrir notre sélection en personne.
            Notre équipe est là pour vous conseiller.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#3ecf4c]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-8 items-center justify-center sm:justify-start">
          {[
            { value: "Sidi Bennour", label: "Localisation" },
            { value: "Lun – Dim", label: "Ouvert 7j/7" },
            { value: "9h – 21h", label: "Horaires" },
            { value: "+212 699 289 568", label: "Téléphone / WhatsApp" },
          ].map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="font-black text-black text-[15px]">{s.value}</p>
              <p className="text-black/60 text-[11px] uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">

        {/* Map + Store card */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">

          {/* Map embed */}
          <div className="rounded-2xl overflow-hidden border border-neutral-100 h-80 lg:h-auto min-h-[320px] bg-neutral-100 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53498.5!2d-8.42!3d32.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdafeee2c2d8e8fb%3A0x1a3e1fcb07c1e5aa!2sSidi%20Bennour!5e0!3m2!1sfr!2sma!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="L'ecomax Sidi Bennour"
            />
            <a
              href="https://maps.google.com/?q=Sidi+Bennour+Maroc"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-black text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors"
            >
              Ouvrir dans Maps ↗
            </a>
          </div>

          {/* Info card */}
          <div className="border border-neutral-100 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">
                Boutique principale
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
                Ouvert maintenant
              </span>
            </div>

            <h2 className="font-black text-2xl uppercase tracking-tight mb-1">L&apos;ecomax</h2>
            <p className="text-neutral-500 text-sm mb-6">Sidi Bennour, Maroc — Fondée en 2026</p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="font-black text-[13px] uppercase tracking-wide">Adresse</p>
                  <p className="text-neutral-500 text-[14px] mt-0.5">Sidi Bennour, Province de Doukkala-Abda, Maroc</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="font-black text-[13px] uppercase tracking-wide">Horaires d&apos;ouverture</p>
                  <div className="text-neutral-500 text-[14px] mt-0.5 space-y-0.5">
                    <p>Lundi – Vendredi : <span className="text-black font-semibold">9h00 – 21h00</span></p>
                    <p>Samedi : <span className="text-black font-semibold">9h00 – 22h00</span></p>
                    <p>Dimanche : <span className="text-black font-semibold">10h00 – 20h00</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <p className="font-black text-[13px] uppercase tracking-wide">WhatsApp / Téléphone</p>
                  <WhatsAppLink className="text-[14px] text-[#25D366] hover:underline font-semibold" showNumber>
                  </WhatsAppLink>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="font-black text-[13px] uppercase tracking-wide">Email</p>
                  <a href="mailto:contact@lecomax.com" className="text-[14px] text-neutral-500 hover:text-black transition-colors">
                    contact@lecomax.com
                  </a>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/212699289568"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#25D366] text-white text-center py-3 rounded-full text-sm font-black uppercase tracking-wide hover:opacity-90 transition-opacity"
              >
                Contacter sur WhatsApp
              </a>
              <Link
                href="/boutique"
                className="flex-1 bg-black text-white text-center py-3 rounded-full text-sm font-black uppercase tracking-wide hover:bg-neutral-800 transition-colors"
              >
                Voir les produits
              </Link>
            </div>
          </div>
        </div>

        {/* About section */}
        <div className="grid sm:grid-cols-3 gap-5 mb-16">
          {[
            { icon: "📍", title: "Sidi Bennour", desc: "Au cœur de la ville, facilement accessible à pied ou en voiture." },
            { icon: "👟", title: "Essayage en boutique", desc: "Essayez chaussures et vêtements avant d'acheter. Notre équipe vous guide." },
            { icon: "🎁", title: "Click & Collect", desc: "Commandez en ligne et retirez gratuitement en boutique dès le lendemain." },
          ].map((f) => (
            <div key={f.title} className="border border-neutral-100 rounded-2xl p-6 hover:border-[#3ecf4c] transition-colors">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-black text-[15px] uppercase tracking-tight mt-3 mb-2">{f.title}</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-neutral-950 text-white p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-2">Shopping en ligne</p>
            <p className="font-black text-2xl uppercase tracking-tight">Pas disponible pour venir ?</p>
            <p className="text-white/50 text-sm mt-2">Commandez sur lecomax.com — livraison partout au Maroc.</p>
          </div>
          <Link
            href="/boutique"
            className="shrink-0 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-8 py-4 rounded-full hover:bg-[#32b83d] transition-colors text-center"
          >
            Voir la boutique en ligne
          </Link>
        </div>

      </div>
    </div>
  );
}
