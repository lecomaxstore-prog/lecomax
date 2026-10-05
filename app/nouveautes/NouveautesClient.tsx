"use client";
import { useStoreRefresh } from "@/lib/use-store-refresh";
import { useMemo, useRef, useState } from "react";
import { selectNewArrivals } from "@/lib/store-collections";
import ProductCard from "@/components/ProductCard";
import { apiToCard, type CardProduct } from "@/lib/products";

export default function NouveautesClient({ initialProducts }: { initialProducts: CardProduct[] }) {
  const PRODUCTS_PER_PAGE = 10;
  const [list, setList] = useState<CardProduct[]>(initialProducts);
  const [page, setPage] = useState(1);
  const productsStartRef = useRef<HTMLElement>(null);

  useStoreRefresh(async (signal) => {
    await fetch("/api/products?active=true", { signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const dbCards = selectNewArrivals(data.map(apiToCard));
          setList(dbCards);
          setPage(current => Math.max(1, Math.min(current, Math.ceil(dbCards.length / PRODUCTS_PER_PAGE))));
        }
      })
      .catch(() => {});
  });

  const pageCount = Math.ceil(list.length / PRODUCTS_PER_PAGE);
  const visibleProducts = useMemo(
    () => list.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE),
    [list, page]
  );

  const changePage = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, pageCount));
    if (safePage === page) return;
    setPage(safePage);
    window.requestAnimationFrame(() => {
      const top = productsStartRef.current?.getBoundingClientRect().top ?? 0;
      window.scrollTo({ top: window.scrollY + top - 84, behavior: "smooth" });
    });
  };

  return (
    <div>
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Collection</p>
          <h1 className="h-display text-5xl mt-2">Nouveautés</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Découvrez les dernières arrivées de la saison — styles inédits et éditions limitées.
          </p>
        </div>
      </section>
      <section ref={productsStartRef} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-6">
        {list.length > 0 ? (
          <>
            <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-3">
              <p className="text-[11px] font-medium text-neutral-500">
                {list.length} produit{list.length > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] font-semibold text-neutral-700">
                Page {page} sur {pageCount}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((p) => (
                <ProductCard key={`${page}-${p.slug}`} product={p} />
              ))}
            </div>

            {pageCount > 1 && (
              <nav aria-label="Pagination des nouveautés" className="mt-12 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                  aria-label="Page précédente"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="m15 18-6-6 6-6"/></svg>
                </button>

                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => changePage(pageNumber)}
                    aria-label={`Aller à la page ${pageNumber}`}
                    aria-current={page === pageNumber ? "page" : undefined}
                    className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-[12px] font-bold transition ${
                      page === pageNumber
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page === pageCount}
                  aria-label="Page suivante"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </nav>
            )}
          </>
        ) : (
          <p className="text-neutral-500 py-20 text-center">Aucune nouveauté pour le moment. Revenez bientôt !</p>
        )}
      </section>
    </div>
  );
}
