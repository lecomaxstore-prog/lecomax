"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/supabase";

type CategoryForm = {
  slug: string;
  label: string;
  image: string;
  image_mobile: string;
  image_position: string;
  image_mobile_position: string;
  description: string;
  active: boolean;
  sort_order: string;
};

const emptyForm: CategoryForm = {
  slug: "", label: "", image: "", image_mobile: "",
  image_position: "50% 50%", image_mobile_position: "50% 50%",
  description: "", active: true, sort_order: "10",
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitPosition(value: string) {
  const match = /^(\d{1,3})% (\d{1,3})%$/.exec(value);
  return { x: Math.min(100, Number(match?.[1] ?? 50)), y: Math.min(100, Number(match?.[2] ?? 50)) };
}

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";
  const showForm = isNew || Boolean(editId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"image" | "image_mobile" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les catégories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const category = categories.find((item) => item.id === editId);
      if (!category) return;
      setForm({
        slug: category.slug,
        label: category.label,
        image: category.image ?? "",
        image_mobile: category.image_mobile ?? "",
        image_position: category.image_position ?? "50% 50%",
        image_mobile_position: category.image_mobile_position ?? "50% 50%",
        description: category.description ?? "",
        active: category.active,
        sort_order: String(category.sort_order),
      });
    } else if (isNew) {
      const nextOrder = categories.length ? Math.max(...categories.map((item) => item.sort_order)) + 10 : 10;
      setForm({ ...emptyForm, sort_order: String(nextOrder) });
    }
  }, [editId, isNew, categories]);

  async function uploadImage(field: "image" | "image_mobile", file: File) {
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "err", text: "Veuillez choisir un fichier image valide." });
      return;
    }
    setUploading(field);
    setMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Échec de l’upload");
      setForm((current) => ({ ...current, [field]: data.url }));
      setMsg({ type: "ok", text: field === "image" ? "Image web ajoutée ✓" : "Image mobile ajoutée ✓" });
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau pendant l’upload" });
    } finally {
      setUploading(null);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      ...form,
      slug: slugify(form.slug || form.label),
      label: form.label.trim(),
      image: form.image.trim() || null,
      image_mobile: form.image_mobile.trim() || null,
      description: form.description.trim() || null,
      sort_order: Number.parseInt(form.sort_order, 10) || 0,
    };
    try {
      const response = await fetch(editId ? `/api/categories/${editId}` : "/api/categories", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible d’enregistrer la catégorie");
      setMsg({ type: "ok", text: editId ? "Catégorie mise à jour ✓" : "Catégorie créée ✓" });
      await load();
      setTimeout(() => router.replace("/admin/categories"), 700);
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement cette catégorie ?")) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Suppression impossible");
      await load();
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau" });
    } finally {
      setDeleting(null);
    }
  }

  async function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length || reordering) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const normalized = reordered.map((item, itemIndex) => ({ ...item, sort_order: (itemIndex + 1) * 10 }));
    setCategories(normalized);
    setReordering(true);
    try {
      const responses = await Promise.all(normalized.map((item) => fetch(`/api/categories/${item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: item.sort_order }),
      })));
      if (responses.some((response) => !response.ok)) throw new Error("L’ordre n’a pas pu être enregistré.");
      setMsg({ type: "ok", text: "Ordre d’affichage mis à jour ✓" });
      setTimeout(() => setMsg(null), 2500);
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau" });
      await load();
    } finally {
      setReordering(false);
    }
  }

  if (showForm) return (
    <div className="mx-auto w-full max-w-6xl pb-24 lg:pb-12">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={() => router.replace("/admin/categories")} className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:border-black hover:text-black" aria-label="Retour"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
        <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-neutral-400">Catalogue</p><h1 className="text-2xl font-black tracking-tight">{editId ? "Modifier la catégorie" : "Nouvelle catégorie"}</h1></div>
      </div>

      <form onSubmit={handleSave} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Informations principales" icon={<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom de la catégorie" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value, slug: current.slug || slugify(value) }))} required placeholder="Ex. Homme" />
              <Field label="Slug de l’URL" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: slugify(value) }))} required placeholder="ex. homme" prefix="/" />
            </div>
            <div><label className="mb-2 block text-[11px] font-black uppercase tracking-[.12em] text-neutral-500">Description</label><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={500} placeholder="Décrivez brièvement cette collection…" className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-4 focus:ring-black/[.04]"/><p className="mt-1 text-right text-[10px] text-neutral-400">{form.description.length}/500</p></div>
          </Panel>

          <Panel title="Visuels responsifs" icon={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>}>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] leading-relaxed text-blue-700">Ajoutez une image paysage pour le web et une image portrait optimisée pour les téléphones. Vous pouvez régler séparément le point visible de chaque image.</div>
            <div className="grid gap-5 xl:grid-cols-2">
              <ImageEditor title="Image web" subtitle="Recommandé : 1600 × 900 px" field="image" positionField="image_position" value={form.image} position={form.image_position} uploading={uploading === "image"} aspect="aspect-[16/9]" onUpload={uploadImage} onValue={(value) => setForm((current) => ({ ...current, image: value }))} onPosition={(value) => setForm((current) => ({ ...current, image_position: value }))} />
              <ImageEditor title="Image mobile" subtitle="Recommandé : 900 × 1200 px" field="image_mobile" positionField="image_mobile_position" value={form.image_mobile} position={form.image_mobile_position} uploading={uploading === "image_mobile"} aspect="aspect-[3/4] max-h-[360px]" onUpload={uploadImage} onValue={(value) => setForm((current) => ({ ...current, image_mobile: value }))} onPosition={(value) => setForm((current) => ({ ...current, image_mobile_position: value }))} fallback={form.image} />
            </div>
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-5">
          <Panel title="Publication" icon={<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>}>
            <Field label="Position dans la liste" type="number" min="0" value={form.sort_order} onChange={(value) => setForm((current) => ({ ...current, sort_order: value }))} />
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div><p className="text-sm font-bold">Catégorie active</p><p className="mt-0.5 text-[11px] text-neutral-400">Visible sur la boutique</p></div><button type="button" role="switch" aria-checked={form.active} onClick={() => setForm((current) => ({ ...current, active: !current.active }))} className={`relative h-6 w-11 rounded-full transition ${form.active ? "bg-[#3ecf4c]" : "bg-neutral-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`}/></button></div>
          </Panel>
          {msg && <Notice message={msg} />}
          <button type="submit" disabled={saving || !form.label.trim() || !form.slug.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-black text-white shadow-lg shadow-black/10 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Enregistrement…</> : editId ? "Enregistrer les modifications" : "Créer la catégorie"}</button>
          <button type="button" onClick={() => router.replace("/admin/categories")} className="h-11 w-full rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-600 transition hover:border-black hover:text-black">Annuler</button>
        </div>
      </form>
    </div>
  );

  const activeCount = categories.filter((category) => category.active).length;
  const withMobileImage = categories.filter((category) => category.image_mobile).length;

  return (
    <div className="mx-auto w-full max-w-7xl pb-12">
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-52 w-52 rounded-full bg-[#3ecf4c]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-[#3ecf4c] shadow-lg shadow-black/10"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg></div><div><div className="mb-1.5 flex items-center gap-2"><h1 className="text-2xl font-black tracking-tight sm:text-[28px]">Catégories</h1><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">{categories.length} au total</span></div><p className="max-w-xl text-sm leading-relaxed text-neutral-500">Organisez les collections et adaptez leurs visuels pour chaque écran.</p></div></div><button onClick={() => router.replace("/admin/categories?new=1")} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-neutral-800"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>Ajouter une catégorie</button></div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3"><Stat label="Catégories actives" value={activeCount} detail={`${categories.length - activeCount} inactive${categories.length - activeCount !== 1 ? "s" : ""}`} tone="emerald"/><Stat label="Visuels mobiles" value={`${withMobileImage}/${categories.length}`} detail="Images optimisées téléphone" tone="blue"/><div className="col-span-2 hidden lg:block lg:col-span-1"><Stat label="Ordre automatique" value="Activé" detail="Utilisez les flèches pour réorganiser" tone="neutral"/></div></div>
      {msg && <div className="mb-4"><Notice message={msg}/></div>}

      {loading ? <div className="grid gap-4 sm:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-neutral-200"/><div className="h-64 animate-pulse rounded-2xl bg-neutral-200"/></div> : categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg></div><h2 className="mt-4 text-lg font-black">Aucune catégorie</h2><p className="mx-auto mt-1 max-w-sm text-sm text-neutral-400">Créez votre première catégorie pour gérer ses images web et mobile.</p><button onClick={() => router.replace("/admin/categories?new=1")} className="mt-5 rounded-xl bg-black px-5 py-3 text-xs font-black text-white">Créer une catégorie</button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <article key={category.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">{category.image ? <img src={category.image} alt={category.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" style={{ objectPosition: category.image_position ?? "50% 50%" }}/> : <div className="flex h-full items-center justify-center text-neutral-300"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m21 15-5-5L5 21"/></svg></div>}<div className="absolute left-3 top-3 flex gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur ${category.active ? "bg-emerald-500/90 text-white" : "bg-black/70 text-white"}`}>{category.active ? "Active" : "Inactive"}</span>{category.image_mobile && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black text-neutral-700 backdrop-blur">Mobile ✓</span>}</div><div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-[9px] font-black text-white backdrop-blur">Position #{index + 1}</div></div>
              <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-base font-black">{category.label}</h2><p className="mt-0.5 truncate text-[11px] text-neutral-400">/{category.slug}</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => moveCategory(index, -1)} disabled={index === 0 || reordering} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-25" aria-label="Monter"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m18 15-6-6-6 6"/></svg></button><button type="button" onClick={() => moveCategory(index, 1)} disabled={index === categories.length - 1 || reordering} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-25" aria-label="Descendre"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6"/></svg></button></div></div><p className="mt-3 line-clamp-2 min-h-9 text-[12px] leading-relaxed text-neutral-500">{category.description || "Aucune description ajoutée."}</p></div>
              <div className="flex items-center gap-2 border-t border-neutral-100 bg-neutral-50/60 p-3"><span className="mr-auto text-[10px] font-bold text-neutral-400">Ordre {category.sort_order}</span><button onClick={() => router.replace(`/admin/categories?id=${category.id}`)} className="flex h-9 items-center gap-2 rounded-xl bg-black px-3 text-[10px] font-black text-white"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>Modifier</button><button onClick={() => handleDelete(category.id)} disabled={deleting === category.id} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 disabled:opacity-50" aria-label="Supprimer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/></svg></button></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.025)]"><div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg></span><h2 className="text-[11px] font-black uppercase tracking-[.16em] text-neutral-700">{title}</h2></div><div className="space-y-5 p-5 sm:p-6">{children}</div></section>;
}

function Field({ label, value, onChange, type = "text", placeholder, required, prefix, min }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; prefix?: string; min?: string }) {
  return <div><label className="mb-2 block text-[11px] font-black uppercase tracking-[.12em] text-neutral-500">{label}</label><div className="relative">{prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">{prefix}</span>}<input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className={`w-full rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-300 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/[.04] ${prefix ? "pl-7" : ""}`}/></div></div>;
}

function ImageEditor({ title, subtitle, field, value, position, uploading, aspect, onUpload, onValue, onPosition, fallback }: { title: string; subtitle: string; field: "image" | "image_mobile"; positionField: string; value: string; position: string; uploading: boolean; aspect: string; onUpload: (field: "image" | "image_mobile", file: File) => void; onValue: (value: string) => void; onPosition: (value: string) => void; fallback?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shownImage = value || fallback || "";
  const { x, y } = splitPosition(position);
  return <div className="overflow-hidden rounded-2xl border border-neutral-200"><div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3"><div><p className="text-sm font-black">{title}</p><p className="text-[10px] text-neutral-400">{subtitle}</p></div><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="rounded-lg bg-black px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">{uploading ? "Upload…" : value ? "Remplacer" : "Ajouter"}</button></div><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) onUpload(field, file); }} onClick={() => inputRef.current?.click()} className={`relative mx-auto w-full cursor-pointer overflow-hidden bg-neutral-100 ${aspect}`}>{shownImage ? <img src={shownImage} alt="Aperçu" className="h-full w-full object-cover" style={{ objectPosition: position }}/> : <div className="flex h-full min-h-44 flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 text-neutral-300"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m21 15-5-5L5 21"/></svg><p className="text-xs font-bold">Glissez ou cliquez</p></div>}{uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white"/></div>}<span className="pointer-events-none absolute left-[calc(var(--x,50%)-6px)] top-[calc(var(--y,50%)-6px)] h-3 w-3 rounded-full border-2 border-white bg-[#3ecf4c] shadow" style={{ left: `calc(${x}% - 6px)`, top: `calc(${y}% - 6px)` }}/></div><div className="space-y-3 p-4"><div><div className="mb-1 flex justify-between text-[10px] font-bold text-neutral-400"><span>Position horizontale</span><span>{x}%</span></div><input type="range" min="0" max="100" value={x} onChange={(event) => onPosition(`${event.target.value}% ${y}%`)} className="w-full accent-black"/></div><div><div className="mb-1 flex justify-between text-[10px] font-bold text-neutral-400"><span>Position verticale</span><span>{y}%</span></div><input type="range" min="0" max="100" value={y} onChange={(event) => onPosition(`${x}% ${event.target.value}%`)} className="w-full accent-black"/></div><input type="url" value={value} onChange={(event) => onValue(event.target.value)} placeholder="Ou collez une URL https://…" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[11px] outline-none focus:border-black"/>{value && <button type="button" onClick={() => onValue("")} className="text-[10px] font-black text-red-500">Supprimer cette image</button>}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(field, file); event.target.value = ""; }}/></div>;
}

function Stat({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: "emerald" | "blue" | "neutral" }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.025)] sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-400">{label}</p><div className="mt-2 flex items-end justify-between gap-2"><p className="text-2xl font-black tracking-tight">{value}</p><span className={`mb-1 h-2 w-2 rounded-full ${tone === "emerald" ? "bg-emerald-500" : tone === "blue" ? "bg-blue-500" : "bg-neutral-400"}`}/></div><p className="mt-1 text-[10px] text-neutral-400 sm:text-[11px]">{detail}</p></div>;
}

function Notice({ message }: { message: { type: "ok" | "err"; text: string } }) {
  return <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><span>{message.type === "ok" ? "✓" : "!"}</span>{message.text}</div>;
}
