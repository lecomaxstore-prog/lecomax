import NewsletterForm from "@/components/NewsletterForm";

const benefits = ["Offres exclusives", "Nouveautés", "Sans spam"];

export default function NewsletterSection() {
  return (
    <section
      aria-labelledby="product-newsletter-title"
      className="relative overflow-hidden rounded-[30px] border border-emerald-100 bg-[#f8fcf9] text-neutral-950 shadow-[0_24px_80px_rgba(13,38,23,.09)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#3ecf4c]/16 blur-[80px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-emerald-100/60 blur-[70px]" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-[#25b83a] via-[#3ecf4c] to-[#1b9c31]" />

      <div className="relative grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-12 lg:px-12 lg:py-12">
        <div>
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-white/85 px-3.5 py-2 shadow-[0_5px_18px_rgba(22,163,74,.06)]">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ecf4c] opacity-35" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[.27em] text-emerald-700">Newsletter privée</span>
          </div>

          <h2 id="product-newsletter-title" className="h-display max-w-[620px] text-[2rem] leading-[.94] tracking-[-.035em] sm:text-[2.6rem] lg:text-[3rem]">
            Les nouveautés,<br /> avant tout le monde.
          </h2>
          <p className="mt-4 max-w-xl text-[13px] leading-6 text-neutral-600 sm:text-[14px] sm:leading-7">
            Une sélection utile de nouveaux produits, promotions et offres privées, directement dans votre boîte e-mail.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {benefits.map((benefit) => (
              <span key={benefit} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 text-[10px] font-bold text-neutral-700 shadow-[0_5px_16px_rgba(15,23,18,.035)]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="m4.5 8 2.1 2.1 4.9-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {benefit}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,18,.10)] ring-1 ring-neutral-200/70 backdrop-blur sm:p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <div>
              <p className="text-[12px] font-black text-neutral-950">Recevez votre accès privé</p>
              <p className="mt-0.5 text-[10px] leading-4 text-neutral-400">Inscription gratuite, sans engagement.</p>
            </div>
          </div>

          <NewsletterForm variant="light" />

          <p className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4 text-center text-[9px] leading-4 text-neutral-400 sm:text-[10px]">
            <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Vos données restent privées. Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>
  );
}
