"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useRef, useState } from "react";
import styles from "./ChatKb.module.css";

type Lang = "all" | "fr" | "ar" | "en";
type KbEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: Lang;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const LANG_LABELS: Record<Lang, string> = { all: "Toutes", fr: "Français", ar: "عربي", en: "English" };
const LANG_COLORS: Record<Lang, string> = {
  all: "bg-neutral-100 text-neutral-600",
  fr: "bg-blue-50 text-blue-700",
  ar: "bg-green-50 text-green-700",
  en: "bg-purple-50 text-purple-700",
};

const DEFAULT_CATEGORIES = ["général", "livraison", "retours", "paiement", "produits", "commande", "fidélité", "contact"];

const EMPTY: Omit<KbEntry, "id" | "created_at"> = {
  question: "", answer: "", category: "général", language: "all", active: true, sort_order: 0,
};

export default function ChatKbPage() {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const mutationBusy = useRef(false);
  const loadVersion = useRef(0);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<KbEntry, "id" | "created_at">>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<Lang | "all">("all");
  const [filterCat, setFilterCat] = useState("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const r = await fetch("/api/chat-kb", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error("La base de connaissance n’a pas pu être chargée. Réessayez.");
      const data = await r.json();
      if (!Array.isArray(data) || !data.every(e => e && typeof e.id === "string" && typeof e.question === "string" && typeof e.answer === "string" && typeof e.category === "string" && ["all", "fr", "ar", "en"].includes(e.language) && typeof e.active === "boolean")) throw new Error("Les données reçues sont incomplètes. Réessayez.");
      if (version === loadVersion.current) setEntries(data);
    } catch (error) {
      if (version === loadVersion.current) setLoadError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Le serveur ne répond pas. Vérifiez votre connexion et réessayez.");
    } finally { if (version === loadVersion.current) setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(e: KbEntry) {
    setForm({ question: e.question, answer: e.answer, category: e.category, language: e.language, active: e.active, sort_order: e.sort_order });
    setEditId(e.id);
    setShowForm(true);
  }

  async function save() {
    if (mutationBusy.current || !form.question.trim() || !form.answer.trim()) return;
    mutationBusy.current = true;
    setSaving(true);
    try {
      const url = editId ? `/api/chat-kb/${editId}` : "/api/chat-kb";
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        showToast(editId ? "Entrée mise à jour ✓" : "Entrée ajoutée ✓");
        setShowForm(false);
        setEditId(null);
        await load();
      } else {
        showToast("Erreur lors de la sauvegarde", false);
      }
    } catch {
      showToast("Sauvegarde non confirmée. Vérifiez la liste avant de réessayer.", false);
    } finally { mutationBusy.current = false; setSaving(false); }
  }

  async function remove(id: string) {
    if (mutationBusy.current) return;
    if (!confirm("Supprimer cette entrée ?")) return;
    mutationBusy.current = true; setPendingId(id);
    try {
      const r = await fetch(`/api/chat-kb/${id}`, { method: "DELETE", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error("Suppression refusée.");
      setEntries(current => current.filter(entry => entry.id !== id));
      showToast("Supprimé ✓");
    } catch { showToast("Suppression non confirmée. Actualisez avant de réessayer.", false); }
    finally { mutationBusy.current = false; setPendingId(null); }
  }

  async function toggleActive(e: KbEntry) {
    if (mutationBusy.current) return;
    mutationBusy.current = true; setPendingId(e.id);
    try {
      const r = await fetch(`/api/chat-kb/${e.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e, active: !e.active }), signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error("Mise à jour refusée.");
      setEntries(current => current.map(entry => entry.id === e.id ? { ...entry, active: !e.active } : entry));
      showToast(e.active ? "Réponse désactivée ✓" : "Réponse activée ✓");
    } catch { showToast("Modification non confirmée. Actualisez avant de réessayer.", false); }
    finally { mutationBusy.current = false; setPendingId(null); }
  }

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...entries.map(e => e.category)])];
  const filtered = entries.filter(e => {
    if (filterLang !== "all" && e.language !== filterLang) return false;
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = entries.filter(e => e.active).length;

  return (
    <div className={`${styles.page} max-w-5xl mx-auto`}>
      {/* Toast */}
      {toast && (
        <div role={toast.ok ? "status" : "alert"} className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-bold transition-all ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="text-[1.4rem] font-black tracking-tight">Base de connaissance du bot</h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {entries.length === 0 && (loading || loadError) ? "Les réponses sont en cours de vérification." : `${activeCount} réponse${activeCount !== 1 ? "s" : ""} active${activeCount !== 1 ? "s" : ""} — le bot Eco les utilise pour répondre aux clients`}
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={saving || pendingId !== null}
          className={`${styles.addButton} flex items-center gap-2 bg-black text-white text-[12px] font-bold px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors`}
        >
          <span className="text-lg leading-none">+</span> Ajouter une réponse
        </button>
      </div>

      {loadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{loadError}</p>{entries.length > 0 && <p className="mt-1 text-xs">Les réponses affichées peuvent ne plus être à jour.</p>}<button type="button" onClick={() => void load()} disabled={loading || saving || pendingId !== null} className="mt-3 min-h-11 rounded-lg border border-red-200 bg-white px-4 font-semibold disabled:opacity-50">Réessayer</button></div>}
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-neutral-500"><span role="status">{filtered.length} réponse{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}</span><button type="button" onClick={() => void load()} disabled={loading || saving || pendingId !== null} className="min-h-11 rounded-lg border border-neutral-200 bg-white px-3 font-semibold disabled:opacity-50">Actualiser</button></div>

      {/* Stats bar */}
      <div className={`${styles.stats} grid grid-cols-4 mb-6`}>
        {(["all", "fr", "ar", "en"] as Lang[]).map(lang => {
          const count = lang === "all" ? entries.filter(e => e.active).length : entries.filter(e => e.language === lang && e.active).length;
          return (
            <button
              key={lang}
              aria-pressed={filterLang === lang}
              onClick={() => setFilterLang(lang)}
              className={`rounded-xl p-3 text-center border transition-all ${filterLang === lang ? "border-black bg-black text-white" : "border-neutral-100 bg-white hover:border-neutral-300"}`}
            >
              <p className="text-[1.4rem] font-black">{entries.length === 0 && (loading || loadError) ? "—" : count}</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5 font-bold">{LANG_LABELS[lang]}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          aria-label="Rechercher une question ou une réponse"
          placeholder="Rechercher une question ou réponse…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black bg-white"
        />
        <select
          value={filterCat}
          aria-label="Filtrer par catégorie"
          onChange={e => setFilterCat(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black bg-white"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="admin-dialog-overlay fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-black text-[16px]">{editId ? "Modifier la réponse" : "Nouvelle réponse"}</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-black text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Question */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                  Question du client
                </label>
                <input
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="Ex: Quel est le délai de livraison ?"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-black"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Écrivez la question comme un vrai client la poserait</p>
              </div>

              {/* Answer */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
                  Réponse exacte du bot
                </label>
                <textarea
                  value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="Ex: La livraison prend 2 à 5 jours ouvrables partout au Maroc, pour un tarif fixe de 40 MAD."
                  rows={5}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-black resize-none"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Le bot utilisera cette réponse comme référence — soyez précis et complet</p>
              </div>

              {/* Row: Category + Language */}
              <div className={`${styles.formFields} grid gap-4`}>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Catégorie</label>
                  <input
                    list="categories-list"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-black"
                  />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Langue</label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value as Lang }))}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-black bg-white"
                  >
                    <option value="all">Toutes les langues</option>
                    <option value="fr">Français seulement</option>
                    <option value="ar">Arabe seulement</option>
                    <option value="en">English only</option>
                  </select>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  aria-label="Activer cette réponse"
                  className={styles.toggle}
                >
                  <span className={styles.track} data-active={form.active}><span className={styles.thumb} /></span>
                </button>
                <span className="text-[13px] font-medium">{form.active ? "Active — le bot utilisera cette réponse" : "Inactive — ignorée par le bot"}</span>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-[13px] font-bold text-neutral-600 hover:text-black transition-colors">
                Annuler
              </button>
              <button
                onClick={save}
                disabled={saving || !form.question.trim() || !form.answer.trim()}
                className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Sauvegarde…" : editId ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <AdminLoading />
      ) : loadError && entries.length === 0 ? null : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🤖</p>
          <p className="font-bold text-neutral-700">{entries.length ? "Aucune réponse ne correspond aux filtres" : "Aucune réponse configurée"}</p>
          <p className="text-sm text-neutral-400 mt-1">{entries.length ? "Essayez un autre mot ou réinitialisez les filtres." : "Ajoutez des Q&R pour améliorer les réponses du bot Eco."}</p>
          <button onClick={entries.length ? () => { setSearch(""); setFilterLang("all"); setFilterCat("all"); } : openNew} className="mt-4 bg-black text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
            {entries.length ? "Réinitialiser les filtres" : "Ajouter la première réponse"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className={`${styles.card} bg-white border border-neutral-100 rounded-2xl transition-all`}>
              <div className={styles.cardLayout}>
                <div className={styles.content}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${LANG_COLORS[e.language]}`}>
                      {LANG_LABELS[e.language]}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {e.category}
                    </span>
                    {!e.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-500">Inactive</span>
                    )}
                  </div>
                  <p dir="auto" className={`${styles.question} font-bold text-neutral-800`}>{e.question}</p>
                  <p dir="auto" className={`${styles.answer} text-neutral-600`}>{e.answer}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => toggleActive(e)}
                    disabled={pendingId !== null || saving || Boolean(loadError)}
                    aria-busy={pendingId === e.id}
                    type="button"
                    role="switch"
                    aria-checked={e.active}
                    aria-label={`${e.active ? "Désactiver" : "Activer"} : ${e.question}`}
                    className={styles.toggle}
                    title={e.active ? "Désactiver" : "Activer"}
                  >
                    <span className={styles.track} data-active={e.active}><span className={styles.thumb} /></span>
                    <span className={styles.status}>{e.active ? "Active" : "Inactive"}</span>
                  </button>
                  <button onClick={() => openEdit(e)} disabled={pendingId !== null || saving || Boolean(loadError)} aria-label={`Modifier : ${e.question}`} className="px-3 py-1.5 text-[11px] font-bold border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50">
                    Modifier
                  </button>
                  <button onClick={() => remove(e.id)} disabled={pendingId !== null || saving || Boolean(loadError)} aria-label={`Supprimer : ${e.question}`} className="px-3 py-1.5 text-[11px] font-bold border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SQL migration */}
      <SqlSection />
    </div>
  );
}

function SqlSection() {
  const [open, setOpen] = useState(false);
  const sql = `-- Run once in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS chat_knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'général',
  language text DEFAULT 'all',
  active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with common Q&As
INSERT INTO chat_knowledge_base (question, answer, category, language) VALUES
('Quel est le délai de livraison ?', 'La livraison prend 2 à 5 jours ouvrables partout au Maroc. Le tarif est fixe : 40 MAD quelle que soit votre commande.', 'livraison', 'fr'),
('كم يستغرق التوصيل؟', 'التوصيل يستغرق من 2 إلى 5 أيام عمل في جميع أنحاء المغرب. التكلفة ثابتة: 35 درهم فقط.', 'livraison', 'ar'),
('Comment suivre ma commande ?', 'Rendez-vous sur lecomax.com/suivre-commande, entrez votre numéro de commande et votre numéro de téléphone.', 'commande', 'fr'),
('Comment retourner un produit ?', 'Vous avez 30 jours pour retourner tout article. Visitez lecomax.com/retours pour démarrer votre retour gratuitement.', 'retours', 'fr'),
('Quels sont les modes de paiement ?', 'Nous acceptons uniquement le paiement à la livraison (cash on delivery). Vous payez uniquement quand vous recevez votre colis — aucun paiement en avance.', 'paiement', 'fr'),
('طريقة الدفع', 'نقبل فقط الدفع عند الاستلام. لا تدفع شيئاً حتى تستلم طلبيتك.', 'paiement', 'ar'),
('What payment methods do you accept?', 'We only accept cash on delivery (COD). You pay only when you receive your package — no prepayment required.', 'paiement', 'en');`;

  return (
    <div className="mt-8">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 hover:text-neutral-700 uppercase tracking-widest transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
        {open ? "Masquer" : "Afficher"} le SQL de migration
      </button>
      {open && (
        <div className="mt-3 bg-neutral-900 rounded-2xl p-4 overflow-x-auto">
          <pre className="text-[11px] text-neutral-300 font-mono leading-relaxed whitespace-pre">{sql}</pre>
          <button onClick={() => navigator.clipboard.writeText(sql)} className="mt-3 text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
            Copier le SQL
          </button>
        </div>
      )}
    </div>
  );
}
