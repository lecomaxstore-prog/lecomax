import NewsletterForm from "@/components/NewsletterForm";

export default function NewsletterSection() {
  return (
    <section
      aria-labelledby="product-newsletter-title"
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-[#fafaf9] text-neutral-950 sm:rounded-3xl"
    >
      <div className="grid gap-6 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-16 lg:px-12 lg:py-12">
        <div>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[.2em] text-neutral-500">
            La newsletter L’ecomax
          </div>

          <h2
            id="product-newsletter-title"
            className="max-w-md text-[28px] font-semibold normal-case leading-[1.15] tracking-[-.035em] sm:text-[34px]"
          >
            Une longueur d’avance.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-6 text-neutral-500">
            Nos nouveautés et offres privées, directement dans votre boîte mail.
          </p>

        </div>

        <div>
          <NewsletterForm variant="light" />

          <p className="mt-3 text-center text-[11px] leading-5 text-neutral-500">
            Gratuit. Désinscription à tout moment.
          </p>
        </div>
      </div>
    </section>
  );
}
