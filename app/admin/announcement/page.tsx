"use client";
import { useEffect, useState } from "react";
import type { Announcement } from "@/lib/supabase";

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setMsg(null);
    // Deactivate all, then insert new active one
    const allRes = await fetch("/api/announcements");
    const all: Announcement[] = await allRes.json();
    await Promise.all(all.map((a) => fetch(`/api/announcements/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) })));
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), active: true }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: "Annonce publiée ✓" }); setText(""); load(); }
  }

  async function setActive(id: string) {
    const allRes = await fetch("/api/announcements");
    const all: Announcement[] = await allRes.json();
    await Promise.all(all.map((a) => fetch(`/api/announcements/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: a.id === id }) })));
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    load();
  }

  const active = announcements.find((a) => a.active);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black mb-1">Barre d&apos;annonce</h1>
      <p className="text-neutral-500 text-sm mb-6">Le texte affiché dans la bannière en haut du site.</p>

      {/* Current active */}
      {active && (
        <div className="bg-black text-white rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p className="text-xs text-white/50 mb-0.5">Annonce active</p>
            <p className="text-sm font-medium">{active.text}</p>
          </div>
        </div>
      )}

      {/* New announcement */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Nouvelle annonce</label>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="🚚 Livraison gratuite dès 300 MAD — Offre limitée !" required
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black mb-3" />
        {msg && <div className={`text-sm px-4 py-3 rounded-xl mb-3 ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
        <button type="submit" disabled={saving} className="bg-black text-white font-bold px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 text-sm">
          {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Publier"}
        </button>
      </form>

      {/* History */}
      {!loading && announcements.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-100">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide px-5 py-3 border-b border-neutral-100">Historique</p>
          <div className="divide-y divide-neutral-50">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <p className="flex-1 text-sm text-neutral-700 truncate">{a.text}</p>
                {a.active ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
                ) : (
                  <button onClick={() => setActive(a.id)} className="text-[10px] font-bold text-neutral-400 hover:text-black border border-neutral-200 hover:border-black px-2 py-1 rounded-full transition-colors">
                    Activer
                  </button>
                )}
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
