"use client";
import { useEffect, useState, useCallback } from "react";

type Subscriber = { id: string; email: string; name: string | null; active: boolean; created_at: string; source?: string };

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/newsletter");
    const data = await res.json();
    setSubscribers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, name: newName || null }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) setMsg({ type: "err", text: data.error ?? "Erreur" });
    else { setMsg({ type: "ok", text: "Abonné ajouté ✓" }); setNewEmail(""); setNewName(""); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function toggleActive(sub: Subscriber) {
    await fetch(`/api/newsletter/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !sub.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet abonné ?")) return;
    await fetch(`/api/newsletter/${id}`, { method: "DELETE" });
    load();
  }

  function exportCSV() {
    const rows = [
      ["Email", "Nom", "Statut", "Date"],
      ...subscribers.map((s) => [s.email, s.name ?? "", s.active ? "Actif" : "Inactif", new Date(s.created_at).toLocaleDateString("fr-FR")]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "newsletter.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = subscribers.filter((s) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const active = subscribers.filter((s) => s.active).length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-black">Newsletter</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Gérez vos abonnés et exportez la liste</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total abonnés", value: subscribers.length, color: "text-black" },
          { label: "Actifs", value: active, color: "text-green-600" },
          { label: "Inactifs", value: subscribers.length - active, color: "text-neutral-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-100 rounded-2xl p-5">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add subscriber */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-6 mb-5">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Ajouter manuellement</h2>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" required placeholder="email@exemple.com"
            className="flex-1 min-w-[200px] border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} type="text" placeholder="Nom (optionnel)"
            className="w-44 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
          <button type="submit" disabled={adding}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-neutral-800 transition-colors">
            {adding ? "…" : "Ajouter"}
          </button>
        </form>
        {msg && <p className={`mt-2 text-xs font-semibold ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
      </div>

      {/* List */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Abonnés</h2>
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-black bg-neutral-50 w-40 transition-all" />
            <button onClick={exportCSV}
              className="text-xs font-semibold border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-neutral-600">{search ? "Aucun résultat" : "Aucun abonné pour l'instant"}</p>
            {!search && <p className="text-xs text-neutral-400 mt-1">Ajoutez votre premier abonné ci-dessus ou configurez le formulaire sur le site</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Email</th>
                <th className="px-5 py-3 text-left font-semibold">Nom</th>
                <th className="px-5 py-3 text-left font-semibold">Source</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-center font-semibold">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 font-medium">{s.email}</td>
                  <td className="px-5 py-3 text-neutral-500">{s.name ?? <span className="text-neutral-300">—</span>}</td>
                  <td className="px-5 py-3 text-neutral-400 text-xs">{s.source ?? "site"}</td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleActive(s)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${s.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                      {s.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(s.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
