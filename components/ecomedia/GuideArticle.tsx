import Link from "next/link";
import type { EcomediaGuide } from "@/lib/ecomedia-guides";
import { serializeJsonLd } from "@/lib/seo";

const SITE_URL = "https://lecomax.com";

export default function GuideArticle({ guide }: { guide: EcomediaGuide }) {
  const canonical = `${SITE_URL}/ecomedia/${guide.slug}/`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: canonical,
    inLanguage: "fr-MA",
    author: { "@type": "Organization", name: "L'ecomax", url: SITE_URL },
    publisher: { "@type": "Organization", name: "L'ecomax", url: SITE_URL },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Ecomedia", item: `${SITE_URL}/ecomedia/` },
      { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-neutral-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }} />

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Fil d’Ariane" className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
          <Link href="/" className="hover:text-black">Accueil</Link><span>/</span>
          <Link href="/ecomedia/" className="hover:text-black">Ecomedia</Link><span>/</span>
          <span className="text-neutral-800">Guide</span>
        </nav>

        <header className="overflow-hidden rounded-[32px] bg-neutral-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-[#58df67]">{guide.eyebrow}</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.045em] sm:text-6xl">{guide.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">{guide.description}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-white/55">
            <span>{guide.readingMinutes} min de lecture</span><span>•</span><span>Mis à jour le 17 juillet 2026</span>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl space-y-12">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-black tracking-[-.025em] sm:text-3xl">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-700 sm:text-base">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {section.bullets && (
                <ul className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-6 text-neutral-700">
                      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />{bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section aria-labelledby="related-products" className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-neutral-200 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-emerald-700">Continuer votre recherche</p>
            <h2 id="related-products" className="mt-2 text-2xl font-black">Produits et ressources associés</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {guide.relatedLinks.map((item) => (
                <Link key={item.href} href={item.href} className="group rounded-2xl border border-neutral-200 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <span className="font-black group-hover:text-emerald-700">{item.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-neutral-500">{item.description}</span>
                  <span className="mt-3 inline-flex text-xs font-black text-emerald-700">Découvrir →</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="text-2xl font-black sm:text-3xl">Questions fréquentes</h2>
            <div className="mt-5 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white px-5">
              {guide.faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="cursor-pointer list-none pr-6 font-black marker:hidden">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
