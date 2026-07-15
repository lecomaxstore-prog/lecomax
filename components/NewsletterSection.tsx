import NewsletterForm from "@/components/NewsletterForm";

export default function NewsletterSection() {
  return (
    <section aria-labelledby="product-newsletter-title" className="relative overflow-hidden rounded-[26px] border border-neutral-200 bg-gradient-to-br from-white via-white to-emerald-50/70 px-5 py-7 text-neutral-950 shadow-[0_22px_70px_rgba(15,23,18,.08)] sm:px-8 sm:py-9 md:px-10 md:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-[#3ecf4c]/15 blur-3xl" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#3ecf4c] via-emerald-500 to-[#3ecf4c]" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-14">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ecf4c] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[9px] font-black uppercase tracking-[.28em] text-emerald-700">Newsletter privée</p>
          </div>
          <h2 id="product-newsletter-title" className="h-display max-w-xl text-[1.8rem] leading-[.98] tracking-[-.025em] sm:text-[2.2rem]">
            Les nouveautés,<br className="hidden sm:block" /> avant tout le monde.
          </h2>
          <p className="mt-3 max-w-xl text-[12px] leading-6 text-neutral-500 sm:text-[13px]">
            Recevez nos nouveaux produits, promotions et offres privées directement par e-mail.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {["Offres exclusives", "Nouveautés", "Sans spam"].map((benefit) => (
              <span key={benefit} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-600">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-emerald-600" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor" opacity=".12" /><path d="m5 8 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {benefit}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-3 shadow-[0_14px_40px_rgba(15,23,18,.06)] backdrop-blur sm:p-4">
          <NewsletterForm variant="light" />
          <p className="mt-3 flex items-center justify-center gap-2 text-[10px] text-neutral-400 sm:justify-start">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Vos données restent privées. Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>
  );
}
