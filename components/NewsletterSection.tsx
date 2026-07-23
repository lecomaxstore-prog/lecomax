import NewsletterForm from "@/components/NewsletterForm";

const benefits = ["Offres privées", "Nouveautés", "Sans spam"];

export default function NewsletterSection() {
  return (
    <section
      aria-labelledby="product-newsletter-title"
      className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-950 shadow-[0_16px_50px_rgba(15,23,42,.06)] sm:rounded-[28px]"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-[#3ecf4c] to-emerald-600" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-50 blur-3xl" />

      <div className="relative grid gap-7 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-14 lg:px-12 lg:py-11">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-emerald-700">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Newsletter privée
          </div>

          <h2
            id="product-newsletter-title"
            className="h-display max-w-[620px] text-[1.8rem] leading-[.98] tracking-[-.035em] sm:text-[2.35rem] lg:text-[2.8rem]"
          >
            Les nouveautés,<br />avant tout le monde.
          </h2>
          <p className="mt-3 max-w-xl text-[12px] leading-5 text-neutral-500 sm:mt-4 sm:text-[14px] sm:leading-6">
            Nouveaux produits, offres privées et bons plans sélectionnés — directement dans votre boîte e-mail.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-semibold text-neutral-500 sm:mt-5 sm:gap-x-4">
            {benefits.map((benefit, index) => (
              <span key={benefit} className="inline-flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true" className="mr-1 hidden h-3 w-px bg-neutral-200 min-[360px]:block" />}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-emerald-600" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".1" />
                  <path d="m5 8 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {benefit}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="mb-3">
            <p className="text-[12px] font-extrabold text-neutral-950">Rejoignez la liste privée</p>
            <p className="mt-0.5 text-[10px] text-neutral-400">Gratuit. Sans engagement. Désinscription en un clic.</p>
          </div>

          <NewsletterForm variant="light" />

          <p className="mt-3 flex items-center gap-1.5 text-[9px] leading-4 text-neutral-400">
            <svg className="shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Vos données restent privées.
          </p>
        </div>
      </div>
    </section>
  );
}
