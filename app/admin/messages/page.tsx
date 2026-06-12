"use client";
import { useEffect, useState, useCallback } from "react";

type Message = { id: string; name: string; email: string; subject: string; message: string; read: boolean; created_at: string };
type InboxEmail = { uid: number; subject: string; from: string; fromAddress: string; date: string; read: boolean; hasAttachment: boolean };
type InboxEmailDetail = InboxEmail & { to: string; text: string; html: string; attachments: { filename: string; contentType: string; size: number }[] };

const STATUS_FILTERS = ["Tous", "Non lus", "Lus"] as const;

export default function MessagesPage() {
  const [tab, setTab] = useState<"contact" | "inbox">("contact");

  // ── Contact form messages ──
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

  // ── IMAP Inbox ──
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmailDetail | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replySent, setReplySent] = useState(false);

  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    setInboxError(null);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      if (data.error) { setInboxError(data.error); return; }
      setInboxEmails(data.emails || []);
    } catch {
      setInboxError("Impossible de se connecter à la boîte mail");
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "inbox") loadInbox();
  }, [tab, loadInbox]);

  async function openEmail(email: InboxEmail) {
    setEmailLoading(true);
    setReplyText("");
    setReplySent(false);
    try {
      const res = await fetch(`/api/inbox/${email.uid}`);
      const data = await res.json();
      setSelectedEmail(data);
      setInboxEmails((prev) => prev.map((e) => e.uid === email.uid ? { ...e, read: true } : e));
    } finally {
      setEmailLoading(false);
    }
  }

  async function deleteEmail(uid: number) {
    if (!confirm("Supprimer cet email ?")) return;
    await fetch(`/api/inbox/${uid}`, { method: "DELETE" });
    setInboxEmails((prev) => prev.filter((e) => e.uid !== uid));
    setSelectedEmail(null);
  }

  async function toggleEmailRead(email: InboxEmail) {
    const newRead = !email.read;
    await fetch(`/api/inbox/${email.uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: newRead }),
    });
    setInboxEmails((prev) => prev.map((e) => e.uid === email.uid ? { ...e, read: newRead } : e));
    if (selectedEmail?.uid === email.uid) setSelectedEmail({ ...selectedEmail, read: newRead });
  }

  async function sendReply() {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);
    try {
      await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.fromAddress,
          subject: `Re: ${selectedEmail.subject}`,
          text: replyText,
        }),
      });
      setReplySent(true);
      setReplyText("");
    } finally {
      setReplying(false);
    }
  }

  const inboxUnread = inboxEmails.filter((e) => !e.read).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black">Messages</h1>
          {unread > 0 && <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unread} non lus</span>}
          {inboxUnread > 0 && <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{inboxUnread} inbox</span>}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">Formulaire de contact &amp; boîte de réception contact@lecomax.com</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-neutral-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("contact")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "contact" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
          Formulaire de contact
          {unread > 0 && <span className="ml-1.5 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
        </button>
        <button onClick={() => setTab("inbox")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tab === "inbox" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/>
          </svg>
          contact@lecomax.com
          {inboxUnread > 0 && <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{inboxUnread}</span>}
        </button>
      </div>

      {/* ── CONTACT FORM TAB ── */}
      {tab === "contact" && (
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
      )} {/* end contact tab */}

      {/* ── INBOX TAB ── */}
      {tab === "inbox" && (
        <div className="flex gap-5">
          {/* Left: email list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-neutral-400">Boîte de réception — <span className="font-semibold text-neutral-600">contact@lecomax.com</span></p>
              <button onClick={loadInbox} disabled={inboxLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={inboxLoading ? "animate-spin" : ""}>
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Actualiser
              </button>
            </div>

            {inboxError ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-red-600 mb-1">Connexion impossible</p>
                <p className="text-xs text-red-400">{inboxError}</p>
                {inboxError.includes("PRIVATE_EMAIL_PASS") && (
                  <p className="text-xs text-neutral-500 mt-3">Ajoutez <code className="bg-neutral-100 px-1 rounded">PRIVATE_EMAIL_PASS</code> dans les variables d&apos;environnement Vercel.</p>
                )}
              </div>
            ) : inboxLoading ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-sm text-neutral-400">Chargement de la boîte mail…</div>
            ) : inboxEmails.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucun email</p>
              </div>
            ) : (
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-50">
                  {inboxEmails.map((email) => (
                    <button key={email.uid} onClick={() => openEmail(email)}
                      className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selectedEmail?.uid === email.uid ? "bg-neutral-50" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${email.read ? "bg-transparent" : "bg-green-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${email.read ? "font-medium text-neutral-600" : "font-bold text-black"}`}>
                              {email.from.replace(/<.*>/, "").trim() || email.fromAddress}
                            </p>
                            <p className="text-[10px] text-neutral-400 flex-shrink-0">
                              {new Date(email.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{email.fromAddress}</p>
                          <p className={`text-xs mt-0.5 truncate ${email.read ? "text-neutral-400" : "text-neutral-600 font-medium"}`}>{email.subject}</p>
                        </div>
                        {email.hasAttachment && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 flex-shrink-0 mt-1">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: email detail */}
          {(selectedEmail || emailLoading) && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 sticky top-24">
                {emailLoading ? (
                  <div className="text-sm text-neutral-400 text-center py-8">Chargement…</div>
                ) : selectedEmail ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-sm truncate">{selectedEmail.from.replace(/<.*>/, "").trim() || selectedEmail.fromAddress}</p>
                        <p className="text-xs text-neutral-400 truncate">{selectedEmail.fromAddress}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(selectedEmail.date).toLocaleString("fr-FR")}</p>
                      </div>
                      <button onClick={() => setSelectedEmail(null)} className="text-neutral-300 hover:text-black transition-colors flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Sujet</p>
                    <p className="text-sm font-semibold mb-4">{selectedEmail.subject}</p>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Message</p>
                    <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto mb-4 border border-neutral-100 rounded-xl p-3 bg-neutral-50">
                      {selectedEmail.text || "(pas de contenu texte)"}
                    </div>

                    {/* Reply */}
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Répondre</p>
                    {replySent ? (
                      <div className="text-xs text-green-600 font-semibold bg-green-50 rounded-xl p-3 text-center">✓ Réponse envoyée</div>
                    ) : (
                      <>
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Votre réponse…"
                          rows={4}
                          className="w-full border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-black resize-none mb-2" />
                        <button onClick={sendReply} disabled={replying || !replyText.trim()}
                          className="w-full bg-black text-white text-xs font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40">
                          {replying ? "Envoi…" : "Envoyer la réponse"}
                        </button>
                      </>
                    )}

                    <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-1.5">
                      <button onClick={() => selectedEmail && toggleEmailRead(selectedEmail)}
                        className="w-full border border-neutral-200 text-xs font-semibold py-2 rounded-xl hover:bg-neutral-50 transition-colors">
                        Marquer comme {selectedEmail.read ? "non lu" : "lu"}
                      </button>
                      <button onClick={() => deleteEmail(selectedEmail.uid)}
                        className="w-full text-xs font-semibold text-red-400 hover:text-red-600 py-1 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )} {/* end inbox tab */}
    </div>
  );
}
