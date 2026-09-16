"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Ad = {
  id: string;
  title: string;
  type: "popup" | "topbar" | "corner" | "floating";
  heading: string | null;
  body: string | null;
  image_url: string | null;
  button_label: string | null;
  button_href: string | null;
  bg_color: string;
  text_color: string;
  accent_color: string;
  delay_seconds: number;
  start_at: string | null;
  end_at: string | null;
  frequency: "always" | "once_session" | "once_day" | "once_total";
  target_pages: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const AD_TYPES = [
  { value: "popup", label: "Popup Modal", desc: "Fenêtre centrée après X secondes", icon: "⊡" },
  { value: "topbar", label: "Barre supérieure", desc: "Bande colorée en haut du site", icon: "▬" },
  { value: "corner", label: "Notification coin", desc: "Carte flottante en bas à droite", icon: "◰" },
  { value: "floating", label: "Bannière flottante", desc: "Bande fixe en bas de l'écran", icon: "▭" },
];

const FREQ_OPTIONS = [
  { value: "once_session", label: "Une fois par session", desc: "Disparaît jusqu'à la prochaine ouverture du navigateur" },
  { value: "once_day", label: "Une fois par jour", desc: "Réapparaît le lendemain" },
  { value: "once_total", label: "Une seule fois", desc: "Ne s'affiche plus jamais après fermeture" },
  { value: "always", label: "Toujours visible", desc: "S'affiche à chaque visite / chargement de page" },
];

const PAGE_OPTIONS = [
  { value: "all", label: "Toutes les pages" },
  { value: "home", label: "Page d'accueil uniquement" },
  { value: "boutique", label: "Boutique / Catalogue" },
  { value: "product", label: "Pages produits" },
  { value: "cart", label: "Panier uniquement" },
];

const emptyForm = {
  title: "", type: "popup" as Ad["type"],
  heading: "", body: "", image_url: "",
  button_label: "", button_href: "",
  bg_color: "#000000", text_color: "#ffffff", accent_color: "#3ecf4c",
  delay_seconds: "3", start_at: "", end_at: "",
  frequency: "once_session" as Ad["frequency"],
  target_pages: "all", active: true, sort_order: "0",
};

export default function AdsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ads?admin=1");
    const data = await res.json();
    setAds(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const a = ads.find((x) => x.id === editId);
      if (a) setForm({
        title: a.title, type: a.type,
        heading: a.heading ?? "", body: a.body ?? "", image_url: a.image_url ?? "",
        button_label: a.button_label ?? "", button_href: a.button_href ?? "",
        bg_color: a.bg_color, text_color: a.text_color, accent_color: a.accent_color,
        delay_seconds: String(a.delay_seconds),
        start_at: a.start_at ? a.start_at.substring(0, 16) : "",
        end_at: a.end_at ? a.end_at.substring(0, 16) : "",
        frequency: a.frequency, target_pages: a.target_pages,
        active: a.active, sort_order: String(a.sort_order),
      });
    } else if (isNew) {
      setForm({ ...emptyForm });
    }
  }, [editId, isNew, ads]);

  async function uploadImage(file: File) {
    setUploadingImg(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingImg(false);
    if (res.ok) setForm((f) => ({ ...f, image_url: data.url }));
    else setMsg({ type: "err", text: data.error ?? "Échec upload" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const payload = {
      title: form.title.trim(), type: form.type,
      heading: form.heading.trim() || null, body: form.body.trim() || null,
      image_url: form.image_url.trim() || null,
      button_label: form.button_label.trim() || null,
      button_href: form.button_href.trim() || null,
      bg_color: form.bg_color, text_color: form.text_color, accent_color: form.accent_color,
      delay_seconds: parseInt(form.delay_seconds) || 0,
      start_at: form.start_at || null, end_at: form.end_at || null,
      frequency: form.frequency, target_pages: form.target_pages,
      active: form.active, sort_order: parseInt(form.sort_order) || 0,
    };
    const url = editId ? `/api/ads/${editId}` : "/api/ads";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur" });
    else { setMsg({ type: "ok", text: "Publicité enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/ads"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette publicité ?")) return;
    await fetch(`/api/ads/${id}`, { method: "DELETE" }); load();
  }

  async function toggleActive(a: Ad) {
    await fetch(`/api/ads/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, active: !a.active }) });
    load();
  }

  const showForm = isNew || !!editId;
  const f = form;

  /* ── Live Preview ── */
  const Preview = () => {
    const bg = f.bg_color || "#000"; const tc = f.text_color || "#fff"; const ac = f.accent_color || "#3ecf4c";
    if (f.type === "topbar") return (
      <div className="rounded-xl overflow-hidden border border-neutral-200">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold" style={{ background: bg, color: tc }}>
          <p className="flex-1 text-center">{f.heading || "Votre texte de barre ici…"}</p>
          {f.button_label && <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: ac, color: "#000" }}>{f.button_label}</span>}
          <button className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      </div>
    );
    if (f.type === "corner") return (
      <div className="flex justify-end">
        <div className="w-72 rounded-2xl shadow-2xl border border-white/10 overflow-hidden" style={{ background: bg, color: tc }}>
          {f.image_url && <img src={f.image_url} alt="" className="w-full h-28 object-cover" loading="lazy" decoding="async" />}
          <div className="p-4">
            {f.heading && <p className="font-black text-base mb-1">{f.heading}</p>}
            {f.body && <p className="text-sm opacity-70 mb-3">{f.body}</p>}
            {f.button_label && <span className="inline-block text-xs font-black px-4 py-2 rounded-xl" style={{ background: ac, color: "#000" }}>{f.button_label}</span>}
          </div>
        </div>
      </div>
    );
    if (f.type === "floating") return (
      <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: bg, color: tc }}>
        <div className="flex items-center gap-4 px-5 py-4">
          {f.image_url && <img src={f.image_url} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" loading="lazy" decoding="async" />}
          <div className="flex-1 min-w-0">
            {f.heading && <p className="font-black">{f.heading}</p>}
            {f.body && <p className="text-sm opacity-70">{f.body}</p>}
          </div>
          {f.button_label && <span className="flex-shrink-0 text-xs font-black px-4 py-2 rounded-xl" style={{ background: ac, color: "#000" }}>{f.button_label}</span>}
          <button className="opacity-50 text-lg leading-none flex-shrink-0">×</button>
        </div>
      </div>
    );
    // popup (default)
    return (
      <div className="rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto" style={{ background: bg, color: tc }}>
        {f.image_url && <img src={f.image_url} alt="" className="w-full h-44 object-cover" loading="lazy" decoding="async" />}
        <div className="p-6">
          {f.heading && <p className="font-black text-xl mb-2">{f.heading}</p>}
          {f.body && <p className="text-sm opacity-70 mb-4">{f.body}</p>}
          {f.button_label && (
            <a className="inline-block text-sm font-black px-6 py-3 rounded-xl" style={{ background: ac, color: "#000" }}>{f.button_label}</a>
          )}
        </div>
      </div>
    );
  };

  if (showForm) return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/ads")} className="p-2 hover:bg-neutral-100 rounded-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className="text-xl font-black">{editId ? "Modifier la publicité" : "Nouvelle publicité"}</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Type selector */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Type d&apos;affichage</h2>
            <div className="grid grid-cols-2 gap-3">
              {AD_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, type: t.value as Ad["type"] }))}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${f.type === t.value ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-neutral-300"}`}>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <p className="font-bold text-sm">{t.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contenu</h2>
            <F label="Nom interne *" value={f.title} onChange={(v) => setForm((x) => ({ ...x, title: v }))} required placeholder="ex: Promo Été 2026" />
            <F label="Titre / Accroche" value={f.heading} onChange={(v) => setForm((x) => ({ ...x, heading: v }))} placeholder="ex: -30% sur tout !" />
            {f.type !== "topbar" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={f.body} onChange={(e) => setForm((x) => ({ ...x, body: e.target.value }))} rows={2}
                  placeholder="ex: Offre valable jusqu'au 30 juin" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <F label="Bouton — texte" value={f.button_label} onChange={(v) => setForm((x) => ({ ...x, button_label: v }))} placeholder="Voir l'offre" />
              <F label="Bouton — lien" value={f.button_href} onChange={(v) => setForm((x) => ({ ...x, button_href: v }))} placeholder="/promotions" />
            </div>
            {f.type !== "topbar" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Image (optionnelle)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setImgDragOver(true); }}
                  onDragLeave={() => setImgDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setImgDragOver(false); const fi = e.dataTransfer.files[0]; if (fi) uploadImage(fi); }}
                  onClick={() => imgInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${imgDragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"}`}>
                  {f.image_url ? (
                    <div className="flex items-center gap-3">
                      <img src={f.image_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" loading="lazy" decoding="async" />
                      <p className="text-xs text-neutral-500 truncate flex-1">{f.image_url.split("/").pop()}</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setForm((x) => ({ ...x, image_url: "" })); }} className="text-neutral-400 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  ) : uploadingImg ? (
                    <div className="flex items-center gap-2 justify-center py-2"><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /><p className="text-sm text-neutral-500">Upload…</p></div>
                  ) : (
                    <p className="text-sm text-neutral-400 text-center py-1">Glissez une image ou <span className="text-black underline">cliquez</span></p>
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const fi = e.target.files?.[0]; if (fi) uploadImage(fi); }} />
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Couleurs</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Fond", key: "bg_color" as const },
                { label: "Texte", key: "text_color" as const },
                { label: "Accent (bouton)", key: "accent_color" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <input type="color" value={f[key]} onChange={(e) => setForm((x) => ({ ...x, [key]: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs font-mono text-neutral-600">{f[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timing & Frequency */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Déclenchement</h2>
            {f.type !== "topbar" && (
              <F label={`Délai avant affichage (secondes)`} type="number" value={f.delay_seconds}
                onChange={(v) => setForm((x) => ({ ...x, delay_seconds: v }))} placeholder="3" />
            )}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Fréquence d&apos;affichage</label>
              <div className="space-y-2">
                {FREQ_OPTIONS.map((o) => (
                  <label key={o.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${f.frequency === o.value ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-neutral-200"}`}>
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${f.frequency === o.value ? "border-black" : "border-neutral-300"}`}>
                        {f.frequency === o.value && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </div>
                    <input type="radio" name="frequency" value={o.value} checked={f.frequency === o.value} onChange={() => setForm((x) => ({ ...x, frequency: o.value as Ad["frequency"] }))} className="sr-only" />
                    <div>
                      <p className="text-sm font-bold">{o.label}</p>
                      <p className="text-xs text-neutral-400">{o.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pages & Scheduling */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ciblage & Planification</h2>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Pages cibles</label>
              <select value={f.target_pages} onChange={(e) => setForm((x) => ({ ...x, target_pages: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-white">
                {PAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Date de début</label>
                <input type="datetime-local" value={f.start_at} onChange={(e) => setForm((x) => ({ ...x, start_at: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Date de fin</label>
                <input type="datetime-local" value={f.end_at} onChange={(e) => setForm((x) => ({ ...x, end_at: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <F label="Ordre d'affichage" type="number" value={f.sort_order} onChange={(v) => setForm((x) => ({ ...x, sort_order: v }))} />
              <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
                <div onClick={() => setForm((x) => ({ ...x, active: !x.active }))} className={`w-10 h-6 rounded-full transition-colors relative ${f.active ? "bg-black" : "bg-neutral-200"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${f.active ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-sm font-medium">Publicité active</span>
              </label>
            </div>
          </div>

          {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
            </button>
            <button type="button" onClick={() => router.replace("/admin/ads")} className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">Annuler</button>
          </div>
        </form>

        {/* Right: Live preview */}
        <div className="xl:sticky xl:top-4 h-fit">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Aperçu en temps réel</h2>
            <div className="bg-neutral-50 rounded-xl p-4 min-h-40">
              <Preview />
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-400">
              <p>• Type : <span className="font-semibold text-neutral-600">{AD_TYPES.find(t => t.value === f.type)?.label}</span></p>
              <p>• Fréquence : <span className="font-semibold text-neutral-600">{FREQ_OPTIONS.find(o => o.value === f.frequency)?.label}</span></p>
              <p>• Pages : <span className="font-semibold text-neutral-600">{PAGE_OPTIONS.find(o => o.value === f.target_pages)?.label}</span></p>
              {f.type !== "topbar" && <p>• Délai : <span className="font-semibold text-neutral-600">{f.delay_seconds}s</span></p>}
              {f.start_at && <p>• Début : <span className="font-semibold text-neutral-600">{new Date(f.start_at).toLocaleString("fr-FR")}</span></p>}
              {f.end_at && <p>• Fin : <span className="font-semibold text-neutral-600">{new Date(f.end_at).toLocaleString("fr-FR")}</span></p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const typeIcon: Record<string, string> = { popup: "⊡", topbar: "▬", corner: "◰", floating: "▭" };
  const statusNow = (a: Ad) => {
    const now = new Date();
    if (!a.active) return { label: "Inactive", color: "bg-neutral-100 text-neutral-500" };
    if (a.start_at && new Date(a.start_at) > now) return { label: "Planifiée", color: "bg-blue-100 text-blue-600" };
    if (a.end_at && new Date(a.end_at) < now) return { label: "Expirée", color: "bg-amber-100 text-amber-600" };
    return { label: "En ligne", color: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Publicités</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Créez des popups, barres, notifications et bannières pour vos visiteurs</p>
        </div>
        <button onClick={() => router.replace("/admin/ads?new=1")} className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle pub
        </button>
      </div>

      {/* Type legend */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {AD_TYPES.map((t) => (
          <div key={t.value} className="bg-white rounded-xl border border-neutral-100 p-3">
            <p className="text-lg mb-1">{t.icon}</p>
            <p className="text-xs font-bold">{t.label}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{t.desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <AdminLoading />
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-neutral-400 text-sm font-medium">Aucune publicité créée.</p>
          <p className="text-neutral-300 text-xs mt-1">Créez votre première popup ou bannière.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ads.map((a) => {
            const st = statusNow(a);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-neutral-100 flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: a.bg_color + "22", border: `2px solid ${a.bg_color}44` }}>
                  {typeIcon[a.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{a.title}</p>
                    <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full capitalize">{AD_TYPES.find(t => t.value === a.type)?.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-neutral-400 truncate">{a.heading || a.body || "Sans contenu"}</p>
                    {a.start_at && <p className="text-[10px] text-neutral-300 flex-shrink-0">Début: {new Date(a.start_at).toLocaleDateString("fr-FR")}</p>}
                    {a.end_at && <p className="text-[10px] text-neutral-300 flex-shrink-0">Fin: {new Date(a.end_at).toLocaleDateString("fr-FR")}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full ${st.color}`}>{st.label}</span>
                  <button onClick={() => toggleActive(a)} className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${a.active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                    {a.active ? "ON" : "OFF"}
                  </button>
                  <button onClick={() => router.replace(`/admin/ads?id=${a.id}`)} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
    </div>
  );
}
