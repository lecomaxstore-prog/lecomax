"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase";
import Link from "next/link";

const CATEGORIES = ["homme", "femme", "chaussures", "accessoires"];

const AVAILABLE_COLORS = [
  { label: "Noir", hex: "#111111" }, { label: "Blanc", hex: "#FFFFFF" },
  { label: "Gris", hex: "#9CA3AF" }, { label: "Rouge", hex: "#EF4444" },
  { label: "Bleu", hex: "#3B82F6" }, { label: "Marine", hex: "#1E3A5F" },
  { label: "Vert", hex: "#10B981" }, { label: "Kaki", hex: "#84784E" },
  { label: "Jaune", hex: "#F59E0B" }, { label: "Orange", hex: "#F97316" },
  { label: "Rose", hex: "#EC4899" }, { label: "Violet", hex: "#8B5CF6" },
  { label: "Beige", hex: "#D4B896" }, { label: "Marron", hex: "#92400E" },
];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

const emptyForm = {
  slug: "", name: "", brand: "", category: "homme", price: "", original_price: "",
  description: "", stock: "0", active: true, featured: false,
  tags: "", weight: "", video: "",
};

type ExtendedProduct = Product & {
  featured?: boolean;
  brand?: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  weight?: number;
  desc_images?: string[];
  video?: string | null;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";
  const filterCat = searchParams.get("cat") ?? "all";

  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [images, setImages] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeGuideType, setSizeGuideType] = useState<"none" | "clothing" | "shoes">("none");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);  const [descImages, setDescImages] = useState<string[]>([]);
  const [uploadingDesc, setUploadingDesc] = useState(false);
  const [dragOverDesc, setDragOverDesc] = useState(false);
  const descFileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const showForm = isNew || !!editId;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const p = products.find((x) => x.id === editId) as ExtendedProduct | undefined;
      if (p) {
        const tags = p.tags ?? [];
        const guideTag = tags.find((t) => t.startsWith("__guide:"));
        setSizeGuideType(guideTag === "__guide:shoes" ? "shoes" : guideTag === "__guide:clothing" ? "clothing" : "none");
        setForm({
          slug: p.slug, name: p.name, brand: p.brand ?? "",
          category: p.category,
          price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
          description: p.description ?? "",
          stock: String(p.stock), active: p.active,
          featured: p.featured ?? false,
          tags: tags.filter((t) => !t.startsWith("__guide:")).join(", "),
          weight: p.weight ? String(p.weight) : "",
          video: (p as ExtendedProduct).video ?? "",
        });
        setImages(p.images?.length ? p.images : []);
        setDescImages((p as ExtendedProduct).desc_images?.length ? (p as ExtendedProduct).desc_images! : []);
        setSelectedColors(p.colors ?? []);
        setSelectedSizes(p.sizes ?? []);
      }
    } else if (isNew) {
      setForm({ ...emptyForm });
      setImages([]);
      setDescImages([]);
      setSelectedColors([]);
      setSelectedSizes([]);
      setSizeGuideType("none");
    }
  }, [editId, isNew, products]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
        else setMsg({ type: "err", text: data.error ?? "Erreur upload" });
      } catch {
        setMsg({ type: "err", text: "Erreur réseau lors de l'upload" });
      }
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function uploadDescFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadingDesc(true);
    const urls: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
        else setMsg({ type: "err", text: data.error ?? "Erreur upload" });
      } catch {
        setMsg({ type: "err", text: "Erreur réseau lors de l'upload" });
      }
    }
    setDescImages((prev) => [...prev, ...urls]);
    setUploadingDesc(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      description: form.description.trim() || null,
      images: images.filter(Boolean),
      stock: parseInt(form.stock) || 0,
      active: form.active,
      featured: form.featured,
      tags: [
        ...form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        ...(sizeGuideType !== "none" ? [`__guide:${sizeGuideType}`] : []),
      ],
      colors: selectedColors,
      sizes: selectedSizes,
      weight: form.weight ? parseFloat(form.weight) : null,
      desc_images: descImages.filter(Boolean),
      video: form.video.trim() || null,
    };
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: editId ? "Produit mis à jour ✓" : "Produit créé ✓" }); load(); setTimeout(() => router.replace("/admin/products"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  async function toggleActive(p: ExtendedProduct) {
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  const toggleColor = (label: string) =>
    setSelectedColors((prev) => prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]);

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const sizeSet =
    sizeGuideType === "shoes" ? SHOE_SIZES
    : sizeGuideType === "clothing" ? CLOTHING_SIZES
    : form.category === "chaussures" ? SHOE_SIZES
    : CLOTHING_SIZES;

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  if (showForm) return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/products")} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-black">{editId ? "Modifier le produit" : "Nouveau produit"}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{editId ? "Mettez à jour les informations" : "Remplissez les champs pour créer un produit"}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* ── LEFT ── */}
          <div className="space-y-4">
            {/* General info */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Informations générales</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Nom du produit *</label>
                <input type="text" value={form.name} required
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    setForm({ ...form, name, slug: editId ? form.slug : slug });
                  }}
                  placeholder="ex: Veste Running Légère"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Slug URL *</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <span className="pl-3 pr-1 text-xs text-neutral-400">/produit/</span>
                    <input type="text" value={form.slug} required
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                      placeholder="veste-running"
                      className="flex-1 pr-4 py-3 text-sm focus:outline-none bg-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Marque</label>
                  <input type="text" value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="ex: Nike, Adidas…"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} placeholder="Décrivez le produit, ses caractéristiques, matières…"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Tags <span className="ml-1 text-[10px] text-neutral-400 font-normal normal-case">Séparés par des virgules</span>
                </label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="running, imperméable, léger…"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
              </div>
            </div>

            {/* Category */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Catégorie</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => {
                  const icons: Record<string, React.ReactNode> = {
                    homme: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="7" r="4"/><path d="M12 14c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"/></svg>,
                    femme: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="7" r="4"/><path d="M6 21l6-7 6 7"/></svg>,
                    chaussures: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 18l4-10 3 5 3-3 4 8H2z"/></svg>,
                    accessoires: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
                  };
                  const active = form.category === c;
                  return (
                    <button key={c} type="button" onClick={() => { setForm({ ...form, category: c }); setSelectedSizes([]); }}
                      className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${active ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black"}`}>
                      {icons[c]}
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Tarification &amp; Stock</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Prix *</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <input type="number" value={form.price} required min="0" step="0.01" onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" />
                    <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Ancien prix</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <input type="number" value={form.original_price} min="0" step="0.01" onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                      className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" />
                    <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
                  </div>
                  {form.original_price && form.price && parseFloat(form.original_price) > parseFloat(form.price) && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">-{Math.round((1 - parseFloat(form.price) / parseFloat(form.original_price)) * 100)}% off</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Stock</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <button type="button" onClick={() => setForm({ ...form, stock: String(Math.max(0, parseInt(form.stock || "0") - 1)) })}
                      className="px-3 py-3 text-neutral-400 hover:text-black transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <input type="number" value={form.stock} min="0" onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="flex-1 py-3 text-sm text-center focus:outline-none bg-transparent w-0" />
                    <button type="button" onClick={() => setForm({ ...form, stock: String(parseInt(form.stock || "0") + 1) })}
                      className="px-3 py-3 text-neutral-400 hover:text-black transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Poids (g)</label>
                  <input type="number" value={form.weight} min="0" onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="250"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Couleurs disponibles
                {selectedColors.length > 0 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">{selectedColors.length}</span>}
              </h2>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((c) => {
                  const active = selectedColors.includes(c.label);
                  return (
                    <button key={c.label} type="button" onClick={() => toggleColor(c.label)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${active ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                      <span className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: c.hex, boxShadow: c.hex === "#FFFFFF" ? "inset 0 0 0 1px #d1d5db" : undefined }} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Tailles disponibles
                  {selectedSizes.length > 0 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">{selectedSizes.length}</span>}
                </h2>
                <Link href="/admin/size-guide" target="_blank"
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-black transition-colors underline underline-offset-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Gérer le guide
                </Link>
              </div>
              {/* Size guide type selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Guide de tailles :</span>
                {(["none", "clothing", "shoes"] as const).map((opt) => {
                  const labels = { none: "Aucun", clothing: "Vêtements", shoes: "Chaussures" };
                  return (
                    <button key={opt} type="button" onClick={() => { setSizeGuideType(opt); setSelectedSizes([]); }}
                      className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                        sizeGuideType === opt ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                      }`}>
                      {labels[opt]}
                    </button>
                  );
                })}
              </div>
              {sizeGuideType === "none" ? (
                <p className="text-xs text-neutral-400 italic">Sélectionnez un guide de tailles pour afficher les tailles disponibles.</p>
              ) : (
              <div className="flex flex-wrap gap-2">
                {sizeSet.map((s) => {
                  const active = selectedSizes.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className={`w-12 h-10 rounded-xl border text-xs font-bold transition-all ${active ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            {/* Description Images */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Images de description</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">{descImages.length} photo{descImages.length !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-4">Photos affichées dans la section description du produit (détails, matières, lifestyle…)</p>
              <input ref={descFileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && uploadDescFiles(e.target.files)} />
              <div
                onClick={() => !uploadingDesc && descFileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOverDesc(true); }}
                onDragLeave={() => setDragOverDesc(false)}
                onDrop={(e) => { e.preventDefault(); setDragOverDesc(false); uploadDescFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3 ${dragOverDesc ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"} ${uploadingDesc ? "pointer-events-none opacity-70" : ""}`}>
                {uploadingDesc ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-neutral-500">Upload en cours…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center mb-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-neutral-700">Cliquer ou glisser des images</p>
                    <p className="text-[10px] text-neutral-400">JPG, PNG, WEBP, AVIF — max 5 MB</p>
                  </div>
                )}
              </div>
              {descImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {descImages.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200" style={{ aspectRatio: "4/3" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setDescImages((prev) => prev.filter((_, j) => j !== i))}
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">
            {/* Images */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Images</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">{images.length} photo{images.length !== 1 ? "s" : ""}</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"} ${uploading ? "pointer-events-none opacity-70" : ""}`}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-neutral-500">Upload en cours…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center mb-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-neutral-700">Cliquer ou glisser des images</p>
                    <p className="text-[10px] text-neutral-400">JPG, PNG, WEBP, AVIF — max 5 MB</p>
                  </div>
                )}
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-black bg-black text-white px-1.5 py-0.5 rounded-full">MAIN</span>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {i > 0 && (
                          <button type="button" onClick={() => setImages((prev) => { const a = [...prev]; [a[0], a[i]] = [a[i], a[0]]; return a; })}
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-black">★</button>
                        )}
                        <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video URL */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Vidéo produit</h2>
              </div>
              <div>
                <input
                  type="url"
                  value={form.video}
                  onChange={(e) => setForm({ ...form, video: e.target.value })}
                  placeholder="https://youtube.com/watch?v=… ou URL .mp4"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-neutral-400 mt-1.5">YouTube, Shorts, ou lien direct vers un fichier vidéo</p>
              </div>
              {form.video.trim() && (() => {
                const ytMatch = form.video.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                const ytId = ytMatch?.[1];
                if (ytId) return (
                  <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?controls=1&rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                );
                return (
                  <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-black">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={form.video} controls className="w-full h-full" />
                  </div>
                );
              })()}
            </div>

            {/* Status & Options */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Statut &amp; Options</h2>
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div>
                  <p className="text-sm font-semibold">Actif</p>
                  <p className="text-[11px] text-neutral-400">Visible sur le site</p>
                </div>
                <div onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.active ? "bg-black" : "bg-neutral-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.active ? "translate-x-4" : ""}`} />
                </div>
              </label>
              <div className="h-px bg-neutral-100" />
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5"><span className="text-yellow-400">★</span> Mis en avant</p>
                  <p className="text-[11px] text-neutral-400">Affiché dans les bestsellers</p>
                </div>
                <div onClick={() => setForm({ ...form, featured: !form.featured })}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? "bg-yellow-400" : "bg-neutral-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.featured ? "translate-x-4" : ""}`} />
                </div>
              </label>
            </div>

            {msg && (
              <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {msg.text}
              </div>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : `${editId ? "Mettre à jour" : "Créer le produit"} →`}
            </button>
            <button type="button" onClick={() => router.replace("/admin/products")}
              className="w-full py-2.5 text-sm text-neutral-500 hover:text-black transition-colors">Annuler</button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Produits</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{products.length} produit{products.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button onClick={() => router.push("/admin/products?new=1")}
          className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau produit
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black bg-white" />
        </div>
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => router.replace(c === "all" ? "/admin/products" : `/admin/products?cat=${c}`)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors ${filterCat === c ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-black"}`}>
            {c === "all" ? "Tous" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          <p className="text-neutral-500 text-sm">Aucun produit trouvé</p>
          <button onClick={() => router.push("/admin/products?new=1")} className="mt-3 text-sm font-bold text-black underline underline-offset-2">Créer le premier produit</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Produit</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Prix</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Tailles</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.name} {p.featured && <span className="text-yellow-400">★</span>}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{p.brand ? `${p.brand} · ` : ""}{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 capitalize">{p.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm">{p.price} MAD</p>
                    {p.original_price && <p className="text-[11px] text-neutral-400 line-through">{p.original_price} MAD</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-yellow-600" : "text-emerald-600"}`}>
                      {p.stock === 0 ? "Épuisé" : `${p.stock}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {p.sizes?.slice(0, 4).map((s) => <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">{s}</span>)}
                      {(p.sizes?.length ?? 0) > 4 && <span className="text-[10px] text-neutral-400">+{(p.sizes?.length ?? 0) - 4}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${p.active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                      {p.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/produit/${p.slug}`} target="_blank"
                        className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button onClick={() => router.push(`/admin/products?id=${p.id}`)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-600">
                        {deleting === p.id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
