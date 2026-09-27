"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LogEntry = {
  id: string;
  title: string;
  body: string | null;
  icon: string | null;
  image: string | null;
  click_url: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

const QUICK_TEMPLATES = [
  { label: "🔥 Promo flash",     title: "Offre Flash — L'ecomax", body: "Profitez de -30% pendant 2h seulement ! Cliquez pour voir l'offre.", url: "/promotions" },
  { label: "🎁 Nouveau produit",  title: "Nouveauté sur L'ecomax !", body: "Découvrez notre dernière collection. Disponible dès maintenant.", url: "/nouveautes" },
  { label: "📦 Livraison offerte", title: "Livraison offerte aujourd'hui !", body: "Sans minimum d'achat. Profitez-en vite, offre limitée.", url: "/boutique" },
  { label: "🛍 Soldes",           title: "Les Soldes commencent maintenant", body: "Jusqu'à -50% sur des centaines d'articles. Ne ratez pas ça !", url: "/boutique" },
];

const AI_TYPES = [
  { value: "promo",    label: "Promotion" },
  { value: "nouveau",  label: "Nouveau produit" },
  { value: "urgence",  label: "Urgence / Flash" },
  { value: "fidélité", label: "Fidélité / Récompense" },
  { value: "livraison", label: "Livraison" },
  { value: "custom",   label: "Personnalisé" },
];

export default function PushPage() {
  const router = useRouter();
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // AI generation state
  const [aiType, setAiType] = useState("promo");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLang, setAiLang] = useState("fr");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    icon: "/icons/premium-v12-192.png",
    image: "",
    url: "/",
    requireInteraction: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [subRes, logRes] = await Promise.all([
      fetch("/api/push/subscribe"),
      fetch("/api/push/send"),
    ]);
    if (subRes.ok) { const d = await subRes.json(); setSubscriberCount(d.count ?? 0); }
    if (logRes.ok) { const d = await logRes.json(); setLog(Array.isArray(d) ? d : []); }
    setLoading(false);
  }

  async function generateWithAI() {
    setGenerating(true); setAiError(null);
    try {
      const res = await fetch("/api/push/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: aiType, prompt: aiPrompt, lang: aiLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur IA");
      setForm(f => ({
        ...f,
        title: data.title ?? f.title,
        body: data.body ?? f.body,
        url: data.url ?? f.url,
        icon: data.icon ?? f.icon,
      }));
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Erreur IA");
    }
    setGenerating(false);
  }

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSending(true); setMsg(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim() || undefined,
          icon: form.icon.trim() || "/icons/premium-v12-192.png",
          image: form.image.trim() || undefined,
          url: form.url.trim() || "/",
          requireInteraction: form.requireInteraction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setMsg({ type: "ok", text: `✓ Envoyé à ${data.sent} abonnés${data.failed > 0 ? ` (${data.failed} échecs)` : ""}` });
      loadData();
    } catch (err: unknown) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    }
    setSending(false);
  }

  function applyTemplate(t: typeof QUICK_TEMPLATES[0]) {
    setForm(f => ({ ...f, title: t.title, body: t.body, url: t.url }));
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="w-full min-w-0 max-w-5xl pb-4">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black">Notifications Push</h1>
          <p className="text-[11px] leading-4 text-neutral-500">Envoyez des messages directement sur les téléphones de vos clients</p>
        </div>
        <div className="ml-auto">
          <button onClick={loadData} className="text-xs border border-neutral-200 px-3 py-2 rounded-xl hover:border-black transition-colors font-medium">
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-2xl border border-neutral-100 min-w-0 p-3 flex flex-col items-start gap-2 sm:p-5 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-9 h-9 shrink-0 sm:w-12 sm:h-12 bg-[#3ecf4c]/10 rounded-2xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black">{loading ? "…" : (subscriberCount ?? 0)}</p>
            <p className="text-[11px] leading-4 text-neutral-500">Abonnés actifs</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 min-w-0 p-3 flex flex-col items-start gap-2 sm:p-5 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-9 h-9 shrink-0 sm:w-12 sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 22-7z"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black">{loading ? "…" : log.length}</p>
            <p className="text-[11px] leading-4 text-neutral-500">Notifications envoyées</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 min-w-0 p-3 flex flex-col items-start gap-2 sm:p-5 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-9 h-9 shrink-0 sm:w-12 sm:h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black">
              {loading ? "…" : log.reduce((acc, l) => acc + l.sent_count, 0)}
            </p>
            <p className="text-[11px] leading-4 text-neutral-500">Total messages livrés</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 sm:gap-6">
        {/* Compose form */}
        <div>
          <form onSubmit={sendNotification} className="space-y-4">
            {/* Quick templates */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Templates rapides</h2>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TEMPLATES.map(t => (
                  <button key={t.label} type="button" onClick={() => applyTemplate(t)}
                    className="text-left px-3 py-2.5 border border-neutral-100 rounded-xl hover:border-black hover:bg-neutral-50 transition-all text-xs font-semibold">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── AI Generation ── */}
            <div className="bg-gradient-to-br from-neutral-950 to-neutral-800 min-w-0 rounded-2xl p-4 text-white sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black">Générer avec l&apos;IA</p>
                  <p className="text-xs leading-5 text-white/60">Un brouillon prêt à relire avant envoi</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AI_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setAiType(t.value)}
                      aria-pressed={aiType === t.value} className={`min-h-11 py-2 px-2 rounded-xl text-xs font-bold transition-all ${aiType === t.value ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Language */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAiLang("fr")}
                    className={`flex-1 min-h-11 py-2 rounded-xl text-xs font-bold transition-all ${aiLang === "fr" ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                    🇫🇷 Français
                  </button>
                  <button type="button" onClick={() => setAiLang("ar")}
                    className={`flex-1 min-h-11 py-2 rounded-xl text-xs font-bold transition-all ${aiLang === "ar" ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                    🇲🇦 Darija
                  </button>
                </div>

                {/* Custom prompt */}
                {(
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Décrivez votre notification (ex: soldes d'été -40% chaussures)"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-base sm:text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-white/50"
                  />
                )}

                {aiError && (
                  <p role="alert" className="break-words text-xs leading-5 text-red-200 bg-red-900/30 px-3 py-2 rounded-xl">{aiError}</p>
                )}

                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={generating}
                  className="w-full bg-white text-black font-black py-3 rounded-xl hover:bg-neutral-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                      </svg>
                      Génération en cours…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      ✨ Générer le contenu
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compose */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Composer</h2>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={60}
                  placeholder="ex: Offre Flash — -30% ce soir seulement !"
                  className="min-w-0 w-full border border-neutral-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-black"
                />
                <p className="text-xs text-neutral-300 text-right mt-1">{form.title.length}/60</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={3}
                  maxLength={200}
                  placeholder="Décrivez votre offre en quelques mots…"
                  className="min-w-0 w-full border border-neutral-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-black resize-none"
                />
                <p className="text-xs text-neutral-300 text-right">{form.body.length}/200</p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Lien au clic
                  </label>
                  <input
                    type="text"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="/promotions"
                    className="min-w-0 w-full border border-neutral-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Icône (URL)
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="/icons/premium-v12-192.png"
                    className="min-w-0 w-full border border-neutral-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Image de bannière (URL optionnelle)
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://... (image affichée dans la notification)"
                  className="min-w-0 w-full border border-neutral-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, requireInteraction: !f.requireInteraction }))}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.requireInteraction ? "bg-black" : "bg-neutral-200"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requireInteraction ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Notification persistante</p>
                  <p className="text-[11px] leading-4 text-neutral-500">Reste affichée jusqu&apos;à ce que l&apos;utilisateur la ferme manuellement</p>
                </div>
              </label>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={sending || !form.title.trim() || (subscriberCount ?? 0) === 0}
              className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2.5 text-sm"
            >
              {sending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 22-7z"/>
                  </svg>
                  Envoyer à {subscriberCount ?? "?"} abonné{(subscriberCount ?? 0) > 1 ? "s" : ""}
                </>
              )}
            </button>

            {msg && (
              <div className={`px-4 py-3 rounded-2xl text-sm font-semibold ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {msg.text}
              </div>
            )}
          </form>
        </div>

        {/* Right: Preview + History */}
        <div className="space-y-4">
          {/* Phone preview */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Aperçu</h2>
            <div className="bg-neutral-900 rounded-2xl p-4 max-w-xs mx-auto">
              <p className="text-xs text-white/30 mb-3 text-center">iPhone — Notification</p>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-700">
                    <img src={form.icon || "/icons/premium-v12-192.png"} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/icons/premium-v12-192.png"; }} loading="lazy" decoding="async" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-xs font-bold truncate">L&apos;ecomax</p>
                      <p className="text-white/30 text-[10px] flex-shrink-0">maintenant</p>
                    </div>
                    <p className="text-white font-bold text-sm mt-0.5 leading-tight">
                      {form.title || "Titre de votre notification"}
                    </p>
                    {form.body && (
                      <p className="text-white/70 text-xs mt-1 leading-relaxed line-clamp-2">{form.body}</p>
                    )}
                  </div>
                </div>
                {form.image && (
                  <img src={form.image} alt="" className="w-full h-24 object-cover rounded-xl mt-2.5"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} loading="lazy" decoding="async" />
                )}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Historique</h2>
            {loading ? (
              <AdminLoading />
            ) : log.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">Aucune notification envoyée</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {log.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{entry.title}</p>
                      {entry.body && <p className="text-[11px] leading-4 text-neutral-500 truncate">{entry.body}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-green-600 font-semibold">✓ {entry.sent_count} envoyés</span>
                        {entry.failed_count > 0 && (
                          <span className="text-xs text-red-400">✗ {entry.failed_count}</span>
                        )}
                        <span className="text-xs text-neutral-300">{fmtDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
