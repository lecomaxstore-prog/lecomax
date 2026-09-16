"use client";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-6">
    <h1 className="text-xl font-bold">Cette page n’a pas pu être chargée</h1>
    <p className="my-3 text-sm text-neutral-600">Vérifiez votre connexion puis réessayez.</p>
    <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-black px-5 font-semibold text-white">Réessayer</button>
  </section>;
}
