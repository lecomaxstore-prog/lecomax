"use client";
import { useEffect, useState, useCallback } from "react";

type Message = { id: string; name: string; email: string; subject: string; message: string; read: boolean; created_at: string };

const STATUS_FILTERS = ["Tous", "Non lus", "Lus"] as const;

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>("Tous");
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(msg: Message, read: boolean) {
    await fetch(`/api/messages/${msg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read } : m));
    if (selected?.id === msg.id) setSelected({ ...msg, read });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  const filtered = messages.filter((m) => {
    const matchFilter = filter === "Tous" || (filter === "Non lus" ? !m.read : m.read);
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black">Messages</h1>
          {unread > 0 && <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unread} non lus</span>}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">Messages reçus depuis le formulaire de contact</p>
      </div>

      <div className="flex gap-5">
        {/* Left: list */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                {f}
              </button>
            ))}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
              className="ml-auto border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-black bg-white w-44 transition-all" />
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucun message</p>
                <p className="text-xs text-neutral-400 mt-1">Les messages du formulaire de contact apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {filtered.map((m) => (
                  <button key={m.id} onClick={() => { setSelected(m); if (!m.read) markRead(m, true); }}
                    className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selected?.id === m.id ? "bg-neutral-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${m.read ? "bg-transparent" : "bg-blue-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${m.read ? "font-medium text-neutral-600" : "font-bold text-black"}`}>{m.name}</p>
                          <p className="text-[10px] text-neutral-400 flex-shrink-0">{new Date(m.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">{m.email}</p>
                        <p className={`text-xs mt-0.5 truncate ${m.read ? "text-neutral-400" : "text-neutral-600 font-medium"}`}>{m.subject}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 sticky top-24">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-sm">{selected.name}</p>
                  <p className="text-xs text-neutral-400">{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-neutral-300 hover:text-black transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Sujet</p>
              <p className="text-sm font-semibold mb-4">{selected.subject}</p>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Message</p>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="w-full bg-black text-white text-xs font-bold py-2.5 rounded-xl text-center hover:bg-neutral-800 transition-colors">
                  Répondre par email
                </a>
                <button onClick={() => markRead(selected, !selected.read)}
                  className="w-full border border-neutral-200 text-xs font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors">
                  Marquer comme {selected.read ? "non lu" : "lu"}
                </button>
                <button onClick={() => handleDelete(selected.id)}
                  className="w-full text-xs font-semibold text-red-400 hover:text-red-600 py-1 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
