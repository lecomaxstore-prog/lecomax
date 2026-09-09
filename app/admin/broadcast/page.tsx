"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useState } from "react";

type Customer = { name: string; phone: string; city?: string; orderCount: number; lastOrder: string };

const TEMPLATES = [
  {
    id: "promo",
    label: "🎁 Promotion",
    preview: "Nouvelle promo exclusive…",
    build: (name: string, msg: string) =>
      `Bonjour ${name} ! 🎉\n\n${msg}\n\n🛒 Profitez-en ici : https://lecomax.com\n\nL'équipe *L'ecomax* 🛍`,
  },
  {
    id: "newproduct",
    label: "🆕 Nouveau produit",
    preview: "Nouvelle collection disponible…",
    build: (name: string, msg: string) =>
      `Bonjour ${name} ! ✨\n\n${msg}\n\n👉 Découvrir : https://lecomax.com/nouveautes\n\nL'équipe *L'ecomax* 🛍`,
  },
  {
    id: "custom",
    label: "✏️ Message libre",
    preview: "Message personnalisé…",
    build: (_name: string, msg: string) => msg,
  },
];

export default function BroadcastPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState("");
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function generateWithAI() {
    if (!aiSubject.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: aiSubject, template }),
      });
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
        setAiOpen(false);
      }
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((orders: Array<{ customer?: { name?: string; phone?: string; city?: string }; created_at: string }>) => {
        if (!Array.isArray(orders)) return;
        const map = new Map<string, Customer>();
        for (const o of orders) {
          const phone = o.customer?.phone;
          if (!phone) continue;
          const existing = map.get(phone);
          if (existing) {
            existing.orderCount++;
            if (new Date(o.created_at) > new Date(existing.lastOrder)) existing.lastOrder = o.created_at;
          } else {
            map.set(phone, {
              name: o.customer?.name ?? "Client",
              phone,
              city: o.customer?.city,
              orderCount: 1,
              lastOrder: o.created_at,
            });
          }
        }
        setCustomers([...map.values()].sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()));
      })
      .finally(() => setLoading(false));
  }, []);

  const tpl = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];

  const filtered = customers.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.phone)));
  }

  function buildLink(c: Customer): string {
    const text = tpl.build(c.name.split(" ")[0] || c.name, message);
    const wa = c.phone.replace(/\s+/g, "").replace(/^0/, "212");
    return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  }

  const selectedList = filtered.filter((c) => selected.has(c.phone));

  function startSending() {
    if (selectedList.length === 0 || !message.trim()) return;
    setCurrentIdx(0);
    setSent(new Set());
  }

  function openNext() {
    if (currentIdx === null) return;
    const c = selectedList[currentIdx];
    window.open(buildLink(c), "_blank");
    setSent((prev) => new Set([...prev, c.phone]));
    if (currentIdx + 1 < selectedList.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(null);
    }
  }

  function cancelSending() {
    setCurrentIdx(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">📣 WhatsApp Broadcast</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Envoyez un message groupé à vos clients via WhatsApp</p>
      </div>

      {/* Sending modal */}
      {currentIdx !== null && (
        <div className="admin-dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-black text-lg">
                {currentIdx + 1}
              </div>
              <div>
                <p className="font-black text-sm">Envoi en cours</p>
                <p className="text-xs text-neutral-500">{currentIdx + 1} / {selectedList.length} — {sent.size} envoyés</p>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200">
              <p className="font-bold text-sm">{selectedList[currentIdx].name}</p>
              <p className="text-xs text-neutral-500">{selectedList[currentIdx].phone}</p>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#25D366] rounded-full transition-all" style={{ width: `${(currentIdx / selectedList.length) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={cancelSending}
                className="py-2.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-500 hover:border-neutral-400 transition-colors">
                Arrêter
              </button>
              <button onClick={openNext}
                className="py-2.5 bg-[#25D366] hover:bg-[#1db954] text-white rounded-xl text-xs font-bold transition-colors">
                Ouvrir WhatsApp →
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 text-center">Cliquez &quot;Ouvrir WhatsApp&quot; puis appuyez Envoyer, et revenez ici pour le suivant.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: customer selection */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <input type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="rounded border-neutral-300 cursor-pointer" />
                <p className="text-xs font-bold text-neutral-700">
                  {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : `${filtered.length} clients`}
                </p>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
                  className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-black w-44" />
              </div>
            </div>

            {loading ? (
              <AdminLoading />
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-neutral-50">
                {filtered.map((c) => (
                  <div key={c.phone}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer ${sent.has(c.phone) ? "opacity-40" : ""}`}
                    onClick={() => setSelected((prev) => { const s = new Set(prev); s.has(c.phone) ? s.delete(c.phone) : s.add(c.phone); return s; })}>
                    <input type="checkbox" checked={selected.has(c.phone)} readOnly className="rounded border-neutral-300 pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-neutral-400">{c.phone}{c.city ? ` · ${c.city}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-neutral-500">{c.orderCount} cmd{c.orderCount > 1 ? "s" : ""}</p>
                      {sent.has(c.phone) && <p className="text-[10px] text-[#25D366] font-bold">✓ Envoyé</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: compose */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Composer le message</p>

            {/* Template selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-600">Template</p>
              <div className="space-y-1.5">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${template === t.id ? "border-black bg-black text-white" : "border-neutral-200 hover:border-neutral-400"}`}>
                    <span className="font-bold">{t.label}</span>
                    <span className={`text-[10px] ml-2 ${template === t.id ? "text-white/60" : "text-neutral-400"}`}>{t.preview}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-neutral-600">
                  {template === "custom" ? "Votre message" : "Contenu principal"}
                </p>
                <button
                  onClick={() => setAiOpen((o) => !o)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                    aiOpen ? "bg-violet-600 text-white border-violet-600" : "border-neutral-200 text-neutral-500 hover:border-violet-400 hover:text-violet-600"
                  }`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
                  IA
                </button>
              </div>

              {/* AI panel */}
              {aiOpen && (
                <div className="mb-2 bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">✨ Générer avec l&apos;IA</p>
                  <input
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateWithAI()}
                    placeholder="Ex: -20% sur tous les sneakers ce weekend…"
                    className="w-full border border-violet-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={generateWithAI}
                    disabled={!aiSubject.trim() || aiLoading}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {aiLoading ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Génération…</>
                    ) : (
                      <>✨ Générer le message</>
                    )}
                  </button>
                </div>
              )}

              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  template === "promo" ? "Ex: Profitez de -20% sur toute la collection avec le code PROMO20 !"
                  : template === "newproduct" ? "Ex: Découvrez nos nouveaux écouteurs sans fil, dispo maintenant !"
                  : "Tapez votre message complet ici…"
                }
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black resize-none"
              />
            </div>

            {/* Preview */}
            {message && (
              <div className="bg-[#e9fbe5] rounded-2xl p-3 text-xs text-neutral-800 leading-relaxed whitespace-pre-line border border-[#c3f0c8]">
                <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mb-2">Aperçu WhatsApp</p>
                {tpl.build("Youssef", message)}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={startSending}
              disabled={selected.size === 0 || !message.trim()}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#1db954] text-white font-black text-sm rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Envoyer à {selected.size} client{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
