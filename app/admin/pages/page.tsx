"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizePageHtml, normalizePageSlug } from "@/lib/site-pages";

type SitePage = {
  id: string; title: string; slug: string; content: string | null;
  meta_title: string | null; meta_description: string | null;
  active: boolean; sort_order: number; created_at: string; updated_at: string;
};

type FormState = { title: string; slug: string; content: string; meta_title: string; meta_description: string; active: boolean; sort_order: string };
const emptyForm: FormState = { title: "", slug: "", content: "", meta_title: "", meta_description: "", active: true, sort_order: "0" };

export default function PagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";
  const showForm = isNew || Boolean(editId);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "draft">("all");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pages", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Impossible de charger les pages.");
      setPages(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const page = pages.find((item) => item.id === editId);
      if (!page) return;
      const next = { title: page.title, slug: page.slug, content: page.content ?? "", meta_title: page.meta_title ?? "", meta_description: page.meta_description ?? "", active: page.active, sort_order: String(page.sort_order) };
      setForm(next); setInitialForm(next); setAutoSlug(false); setMessage(null);
    } else if (isNew) {
      setForm(emptyForm); setInitialForm(emptyForm); setAutoSlug(true); setMessage(null);
    }
  }, [editId, isNew, pages]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  useEffect(() => {
    if (!showForm || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, showForm]);

  function closeEditor() {
    if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) return;
    router.replace("/admin/pages");
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function insertHtml(before: string, after = "") {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const selected = form.content.slice(start, end);
    const next = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`;
    updateField("content", next);
    requestAnimationFrame(() => { textarea?.focus(); textarea?.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(editId ? `/api/pages/${editId}` : "/api/pages", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: normalizePageSlug(form.slug), sort_order: Number(form.sort_order) || 0 }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d’enregistrer cette page.");
      const saved: FormState = { title: result.title, slug: result.slug, content: result.content ?? "", meta_title: result.meta_title ?? "", meta_description: result.meta_description ?? "", active: result.active, sort_order: String(result.sort_order) };
      setForm(saved); setInitialForm(saved); setMessage({ ok: true, text: form.active ? "Page publiée avec succès." : "Brouillon enregistré avec succès." });
      await load();
      window.setTimeout(() => router.replace("/admin/pages"), 700);
    } catch (saveError) {
      setMessage({ ok: false, text: saveError instanceof Error ? saveError.message : "Erreur d’enregistrement." });
    } finally { setSaving(false); }
  }

  async function togglePage(page: SitePage) {
    setWorkingId(page.id); setMessage(null);
    try {
      const response = await fetch(`/api/pages/${page.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !page.active }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible de changer le statut.");
      setPages((current) => current.map((item) => item.id === page.id ? { ...item, active: result.active, updated_at: result.updated_at } : item));
      setMessage({ ok: true, text: result.active ? "La page est maintenant publiée." : "La page est passée en brouillon." });
    } catch (toggleError) { setMessage({ ok: false, text: toggleError instanceof Error ? toggleError.message : "Modification impossible." }); }
    finally { setWorkingId(null); }
  }

  async function removePage(page: SitePage) {
    if (!window.confirm(`Supprimer définitivement « ${page.title} » ?`)) return;
    setWorkingId(page.id); setMessage(null);
    try {
      const response = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Suppression impossible.");
      setPages((current) => current.filter((item) => item.id !== page.id));
      setMessage({ ok: true, text: "Page supprimée." });
    } catch (deleteError) { setMessage({ ok: false, text: deleteError instanceof Error ? deleteError.message : "Suppression impossible." }); }
    finally { setWorkingId(null); }
  }

  const activeCount = pages.filter((page) => page.active).length;
  const visiblePages = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fr-FR");
    return pages.filter((page) => (status === "all" || (status === "active" ? page.active : !page.active)) && (!needle || `${page.title} ${page.slug}`.toLocaleLowerCase("fr-FR").includes(needle)));
  }, [pages, search, status]);

  if (showForm) return <PageEditor form={form} updateField={updateField} autoSlug={autoSlug} setAutoSlug={setAutoSlug} editId={editId} saving={saving} message={message} dirty={dirty} editorTab={editorTab} setEditorTab={setEditorTab} contentRef={contentRef} insertHtml={insertHtml} save={save} closeEditor={closeEditor} />;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
      <header className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-5 py-6 text-white shadow-xl sm:px-7 sm:py-7">
        <div aria-hidden="true" className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-300"><span className="h-2 w-2 rounded-full bg-blue-400" />Contenu du site</div><h1 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">Pages personnalisées</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Créez des pages éditoriales professionnelles, optimisées pour le référencement et publiées instantanément.</p></div>
          <button onClick={() => router.push("/admin/pages?new=1")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-[#3ecf4c]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>Nouvelle page</button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3" aria-label="Résumé des pages">
        <Metric label="Total" value={pages.length} helper="pages créées" />
        <Metric label="Publiées" value={activeCount} helper="visibles en ligne" accent="green" />
        <Metric label="Brouillons" value={pages.length - activeCount} helper="non publiés" accent="orange" />
      </section>

      {message && <Notice message={message} />}
      {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span className="font-bold">{error}</span><button onClick={() => void load()} className="min-h-11 rounded-xl bg-red-700 px-4 font-black text-white">Réessayer</button></div>}

      <section className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex rounded-2xl bg-neutral-100 p-1">{([{ id: "all", label: "Toutes" }, { id: "active", label: "Publiées" }, { id: "draft", label: "Brouillons" }] as const).map((item) => <button key={item.id} onClick={() => setStatus(item.id)} className={`min-h-11 flex-1 rounded-xl px-3 text-xs font-black transition sm:flex-none sm:px-4 ${status === item.id ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:text-black"}`}>{item.label}</button>)}</div>
          <label className="relative sm:min-w-[300px]"><span className="sr-only">Rechercher une page</span><svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une page…" className="min-h-11 w-full rounded-xl border border-neutral-200 pl-10 pr-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5" /></label>
        </div>

        {loading ? <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />)}</div> : visiblePages.length === 0 ? <EmptyPages hasPages={pages.length > 0} onCreate={() => router.push("/admin/pages?new=1")} /> : <div className="divide-y divide-neutral-100">{visiblePages.map((page) => <PageRow key={page.id} page={page} working={workingId === page.id} onEdit={() => router.push(`/admin/pages?id=${encodeURIComponent(page.id)}`)} onToggle={() => void togglePage(page)} onDelete={() => void removePage(page)} />)}</div>}
      </section>
    </div>
  );
}

function PageEditor({ form, updateField, autoSlug, setAutoSlug, editId, saving, message, dirty, editorTab, setEditorTab, contentRef, insertHtml, save, closeEditor }: { form: FormState; updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void; autoSlug: boolean; setAutoSlug: (value: boolean) => void; editId: string | null; saving: boolean; message: { ok: boolean; text: string } | null; dirty: boolean; editorTab: "edit" | "preview"; setEditorTab: (value: "edit" | "preview") => void; contentRef: React.RefObject<HTMLTextAreaElement | null>; insertHtml: (before: string, after?: string) => void; save: (event: React.FormEvent) => void; closeEditor: () => void }) {
  const previewTitle = form.meta_title || form.title || "Titre de la page";
  const previewDescription = form.meta_description || "Ajoutez une description pour améliorer l’affichage dans les résultats de recherche.";
  return <form onSubmit={save} className="mx-auto w-full max-w-[1400px] space-y-5 pb-24 lg:pb-0">
    <header className="flex flex-col gap-4 rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={closeEditor} aria-label="Retour aux pages" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition hover:bg-black hover:text-white"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M19 12H5m7-7-7 7 7 7"/></svg></button><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-xl font-black sm:text-2xl">{editId ? "Modifier la page" : "Créer une page"}</h1>{dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400" title="Modifications non enregistrées" />}</div><p className="mt-0.5 truncate text-xs text-neutral-400">{form.slug ? `lecomax.com/${form.slug}` : "Configurez le contenu et la publication"}</p></div></div><div className="hidden gap-2 lg:flex"><button type="button" onClick={closeEditor} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-xs font-bold">Annuler</button><SaveButton saving={saving} active={form.active} /></div></header>

    {message && <Notice message={message} />}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
      <div className="space-y-5">
        <section className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-6"><SectionTitle eyebrow="Informations" title="Identité de la page" /><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Titre de la page" required><input required maxLength={120} value={form.title} onChange={(event) => { const title = event.target.value; updateField("title", title); if (autoSlug) updateField("slug", normalizePageSlug(title)); }} placeholder="À propos de nous" className={inputClass} /></Field><Field label="Adresse de la page" required><div className="flex min-h-12 items-center rounded-xl border border-neutral-200 bg-white px-3 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5"><span className="text-sm font-bold text-neutral-300">/</span><input required maxLength={80} value={form.slug} onChange={(event) => { setAutoSlug(false); updateField("slug", normalizePageSlug(event.target.value)); }} placeholder="a-propos" className="min-w-0 flex-1 px-2 text-sm font-bold outline-none" /></div><p className="mt-1.5 text-[11px] text-neutral-400">Minuscules, chiffres et tirets uniquement.</p></Field></div></section>

        <section className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><SectionTitle eyebrow="Éditeur" title="Contenu de la page" compact /><div className="flex rounded-xl bg-neutral-100 p-1"><button type="button" onClick={() => setEditorTab("edit")} className={`min-h-10 rounded-lg px-4 text-xs font-black ${editorTab === "edit" ? "bg-white text-black shadow-sm" : "text-neutral-500"}`}>Écrire</button><button type="button" onClick={() => setEditorTab("preview")} className={`min-h-10 rounded-lg px-4 text-xs font-black ${editorTab === "preview" ? "bg-white text-black shadow-sm" : "text-neutral-500"}`}>Aperçu</button></div></div>{editorTab === "edit" ? <><div className="flex gap-1 overflow-x-auto border-b border-neutral-100 bg-neutral-50 px-3 py-2 [scrollbar-width:none]">{[{ label: "Titre", before: "<h2>", after: "</h2>" }, { label: "Paragraphe", before: "<p>", after: "</p>" }, { label: "Gras", before: "<strong>", after: "</strong>" }, { label: "Liste", before: "<ul>\n  <li>", after: "</li>\n</ul>" }, { label: "Lien", before: '<a href="https://">', after: "</a>" }].map((tool) => <button key={tool.label} type="button" onClick={() => insertHtml(tool.before, tool.after)} className="min-h-9 shrink-0 rounded-lg border border-neutral-200 bg-white px-3 text-[11px] font-bold text-neutral-600 hover:border-black hover:text-black">{tool.label}</button>)}</div><textarea ref={contentRef} value={form.content} onChange={(event) => updateField("content", event.target.value)} rows={18} placeholder={'<h2>Notre histoire</h2>\n<p>Présentez votre contenu ici…</p>'} className="min-h-[420px] w-full resize-y px-4 py-5 font-mono text-[13px] leading-7 outline-none sm:px-6" /><p className="border-t border-neutral-100 px-4 py-3 text-[11px] leading-5 text-neutral-400 sm:px-6">HTML sécurisé : titres, paragraphes, listes, liens, images et mise en valeur. Les scripts et attributs dangereux sont supprimés à l’affichage.</p></> : <div className="min-h-[510px] bg-neutral-50 p-4 sm:p-8"><div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8"><h1 className="text-3xl font-black tracking-tight">{form.title || "Titre de la page"}</h1>{form.content ? <div className="prose prose-neutral mt-7 max-w-none prose-headings:font-black prose-a:text-black" dangerouslySetInnerHTML={{ __html: sanitizePageHtml(form.content) }} /> : <p className="mt-6 text-sm text-neutral-400">Commencez à écrire pour afficher l’aperçu.</p>}</div></div>}</section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-sm"><SectionTitle eyebrow="Publication" title="Visibilité" compact /><button type="button" onClick={() => updateField("active", !form.active)} role="switch" aria-checked={form.active} className={`mt-5 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${form.active ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-neutral-50"}`}><span className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.active ? "bg-emerald-500" : "bg-neutral-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} /></span><span><span className="block text-sm font-black">{form.active ? "Publiée" : "Brouillon"}</span><span className="mt-0.5 block text-[11px] text-neutral-500">{form.active ? "Visible immédiatement sur le site" : "Visible uniquement dans l’administration"}</span></span></button><Field label="Ordre d’affichage" className="mt-5"><input type="number" min={0} max={9999} value={form.sort_order} onChange={(event) => updateField("sort_order", event.target.value)} className={inputClass} inputMode="decimal" /></Field></section>

        <section className="rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-sm"><SectionTitle eyebrow="Référencement" title="SEO Google" compact /><div className="mt-5 space-y-5"><Field label="Titre SEO"><input maxLength={70} value={form.meta_title} onChange={(event) => updateField("meta_title", event.target.value)} placeholder={form.title || "Titre de la page"} className={inputClass} /><Counter value={form.meta_title.length} recommended={60} max={70} /></Field><Field label="Description SEO"><textarea maxLength={180} rows={4} value={form.meta_description} onChange={(event) => updateField("meta_description", event.target.value)} placeholder="Résumé affiché dans les moteurs de recherche…" className={`${inputClass} resize-none py-3`} /><Counter value={form.meta_description.length} recommended={160} max={180} /></Field><div className="rounded-2xl border border-neutral-200 bg-white p-3"><p className="truncate text-[15px] text-[#1a0dab]">{previewTitle}</p><p className="mt-1 truncate text-xs text-emerald-700">lecomax.com/{form.slug || "votre-page"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{previewDescription}</p></div></div></section>
      </aside>
    </div>

    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex gap-2 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur lg:static lg:hidden"><button type="button" onClick={closeEditor} className="min-h-12 flex-1 rounded-xl border border-neutral-200 text-xs font-bold">Annuler</button><SaveButton saving={saving} active={form.active} className="flex-1" /></div>
  </form>;
}

const inputClass = "min-h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/5";
function Field({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) { return <label className={`block ${className}`}><span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-500">{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>; }
function SectionTitle({ eyebrow, title, compact = false }: { eyebrow: string; title: string; compact?: boolean }) { return <div><p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-neutral-400">{eyebrow}</p><h2 className={`${compact ? "text-base" : "text-lg"} mt-0.5 font-black tracking-tight`}>{title}</h2></div>; }
function Counter({ value, recommended, max }: { value: number; recommended: number; max: number }) { return <p className={`mt-1.5 text-right text-[10px] font-bold ${value > recommended ? "text-orange-600" : "text-neutral-400"}`}>{value}/{max} · recommandé {recommended}</p>; }
function SaveButton({ saving, active, className = "" }: { saving: boolean; active: boolean; className?: string }) { return <button type="submit" disabled={saving} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-black text-white transition hover:bg-neutral-800 disabled:opacity-50 ${className}`}>{saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}{saving ? "Enregistrement…" : active ? "Enregistrer et publier" : "Enregistrer le brouillon"}</button>; }
function Notice({ message }: { message: { ok: boolean; text: string } }) { return <div role="status" className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${message.ok ? "bg-emerald-500" : "bg-red-500"}`} />{message.text}</div>; }
function Metric({ label, value, helper, accent = "neutral" }: { label: string; value: number; helper: string; accent?: "neutral" | "green" | "orange" }) { const style = accent === "green" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : accent === "orange" ? "bg-orange-50 border-orange-100 text-orange-800" : "bg-white border-neutral-200 text-neutral-950"; return <div className={`min-w-0 rounded-2xl border p-3 shadow-sm sm:p-5 ${style}`}><p className="text-[9px] font-extrabold uppercase tracking-[0.13em] opacity-60">{label}</p><p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{value}</p><p className="mt-1 truncate text-[10px] font-semibold opacity-55 sm:text-xs">{helper}</p></div>; }
function EmptyPages({ hasPages, onCreate }: { hasPages: boolean; onCreate: () => void }) { return <div className="px-5 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg></span><h2 className="mt-4 text-base font-black">{hasPages ? "Aucune page trouvée" : "Créez votre première page"}</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-400">{hasPages ? "Modifiez la recherche ou le filtre sélectionné." : "Publiez une page À propos, des conditions de vente ou tout autre contenu utile."}</p>{!hasPages && <button onClick={onCreate} className="mt-5 min-h-11 rounded-xl bg-black px-5 text-xs font-black text-white">Créer une page</button>}</div>; }
function PageRow({ page, working, onEdit, onToggle, onDelete }: { page: SitePage; working: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) { return <article className="flex flex-col gap-4 p-4 transition hover:bg-neutral-50/70 sm:flex-row sm:items-center sm:p-5"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${page.active ? "bg-blue-50 text-blue-600" : "bg-neutral-100 text-neutral-400"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black sm:text-[15px]">{page.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${page.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{page.active ? "Publiée" : "Brouillon"}</span></div><p className="mt-1 truncate font-mono text-[11px] text-neutral-400">lecomax.com/{page.slug}</p><p className="mt-1 text-[10px] text-neutral-300">Modifiée le {new Date(page.updated_at || page.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p></div><div className="grid grid-cols-2 gap-2 sm:flex sm:items-center"><a href={`/${page.slug}/`} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 transition hover:border-black hover:text-black ${!page.active ? "pointer-events-none opacity-40" : ""}`}>Voir</a><button onClick={onEdit} className="min-h-11 rounded-xl bg-black px-4 text-xs font-black text-white hover:bg-neutral-800">Modifier</button><button onClick={onToggle} disabled={working} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-600 hover:border-black disabled:opacity-40">{page.active ? "Dépublier" : "Publier"}</button><button onClick={onDelete} disabled={working} aria-label={`Supprimer ${page.title}`} className="min-h-11 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40">Supprimer</button></div></article>; }
