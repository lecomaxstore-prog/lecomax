export default function AdminLoading() {
  return <div role="status" aria-label="Chargement en cours" className="space-y-4 motion-safe:animate-pulse">
    <span className="sr-only">Chargement en cours…</span>
    <div className="h-8 w-2/3 rounded-xl bg-neutral-200" />
    <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-neutral-100" />)}</div>
    {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl border border-neutral-100 bg-white p-4"><div className="h-4 w-1/2 rounded bg-neutral-100" /><div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" /></div>)}
  </div>;
}
