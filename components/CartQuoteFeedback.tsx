"use client";

/** Quote errors stay separate from order/payment errors and clear on recovery. */
export default function CartQuoteFeedback({ loading, error, ready, refresh }: {
  loading: boolean; error?: string; ready: boolean; refresh: () => void;
}) {
  return (
    <div className="text-sm leading-5" data-quote-feedback>
      <p role="status" aria-live="polite" aria-atomic="true" className="text-neutral-700">
        {loading ? "Calcul des frais de livraison…" : ready ? "Frais de livraison et total confirmés." : "Frais de livraison et total à confirmer."}
      </p>
      {error && <p role="alert" className="mt-2 font-medium text-red-800">{error}</p>}
      {!ready && (
        <button type="button" onClick={refresh} disabled={loading}
          className="mt-2 min-h-11 rounded-lg border border-neutral-400 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60">
          {loading ? "Calcul en cours…" : "Réessayer le calcul"}
        </button>
      )}
    </div>
  );
}
