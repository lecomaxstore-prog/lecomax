"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase";
import Link from "next/link";
import { useApproval } from "@/lib/use-approval";

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
  description_images?: string[];
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
  const [sizeGuideType, setSizeGuideType] = useState<"none" | "clothing" | "shoes" | "custom">("none");
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);  const [descImages, setDescImages] = useState<string[]>([]);
  const [uploadingDesc, setUploadingDesc] = useState(false);
  const [dragOverDesc, setDragOverDesc] = useState(false);
  const descFileInputRef = useRef<HTMLInputElement>(null);
  const [productDetails, setProductDetails] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<Array<{
    id: string; action: string; description: string;
    payload: Record<string, unknown> | null; created_at: string;
  }>>([]);
  const { isStaff, userEmail, ready, submitForApproval } = useApproval();
  const tableRef = useRef<HTMLDivElement>(null);
  // Tracks which editId has been initialized — prevents products re-fetch from
  // wiping images the user just uploaded (same mobile session-refresh bug).
  const initializedEditIdRef = useRef<string | null>(null);

  const scrollTable = (dir: "left" | "right") => {
    tableRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  const showForm = isNew || !!editId;

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setMsg(null);
    try {
      if (isStaff && userEmail) {
        // Staff: only their own approved products + their pending approvals
        const [prodRes, approvalRes] = await Promise.all([
          fetch(`/api/products/?created_by=${encodeURIComponent(userEmail)}`, { cache: "no-store" }),
          fetch("/api/admin/approvals/?status=pending", { cache: "no-store" }),
        ]);
        if (!prodRes.ok || !approvalRes.ok) throw new Error("Impossible de charger les produits.");
        const prodData = await prodRes.json();
        const approvalData = await approvalRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
        const myPending = (Array.isArray(approvalData) ? approvalData : []).filter(
          (c: { staff_email: string; entity_type: string }) =>
            c.staff_email === userEmail && c.entity_type === "product"
        );
        setPendingProducts(myPending);
      } else {
        // Owner: all products
        const res = await fetch("/api/products/", { cache: "no-store" });
        if (!res.ok) throw new Error("Impossible de charger les produits.");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setPendingProducts([]);
      }
    } catch (error) {
      setProducts([]);
      setMsg({
        type: "err",
        text: error instanceof Error ? error.message : "Impossible de charger les produits.",
      });
    } finally {
      setLoading(false);
    }
  }, [ready, isStaff, userEmail]);

  useEffect(() => { load(); }, [load]);

  // ── Reset form when entering "new product" mode ──────────────────────────
  // NOTE: depends ONLY on [isNew] so that background product-list re-fetches
  // (triggered by Supabase session refresh on mobile tab-switch) do NOT wipe
  // the images the user just uploaded.
  useEffect(() => {
    if (!isNew) return;
    setForm({ ...emptyForm });
    setImages([]);
    setDescImages([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSizeGuideType("none");
    setCustomSizes([]);
    setSizeStocks({});
    setProductDetails([]);
    // Clear any leftover sessionStorage draft from a previous session
    sessionStorage.removeItem("__new_product_images");
    sessionStorage.removeItem("__new_product_desc_images");
  }, [isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load product data when editing ───────────────────────────────────────
  useEffect(() => {
    if (!editId) { initializedEditIdRef.current = null; return; }
    const p = products.find((x) => x.id === editId) as ExtendedProduct | undefined;
    if (!p) return;
    // Only initialize once per editId — subsequent products reloads (e.g. mobile
    // Supabase session refresh) must NOT overwrite images the user just uploaded.
    if (initializedEditIdRef.current === editId) return;
    initializedEditIdRef.current = editId;
    const tags = p.tags ?? [];
    const guideTag = tags.find((t) => t.startsWith("__guide:"));
    setSizeGuideType(guideTag === "__guide:shoes" ? "shoes" : guideTag === "__guide:clothing" ? "clothing" : guideTag === "__guide:custom" ? "custom" : "none");
    setForm({
      slug: p.slug, name: p.name, brand: p.brand ?? "",
      category: p.category,
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      description: p.description ?? "",
      stock: String(p.stock), active: p.active,
      featured: p.featured ?? false,
      tags: tags.filter((t) => !t.startsWith("__guide:") && !t.startsWith("__sstock:") && !t.startsWith("__detail:")).join(", "),
      weight: p.weight ? String(p.weight) : "",
      video: (p as ExtendedProduct).video ?? "",
    });
    // Prefer sessionStorage over DB if the user had uploaded images that survived
    // a mobile page reload (sessionStorage is cleared on successful save).
    try {
      const cachedImgs = sessionStorage.getItem(`__edit_product_images_${editId}`);
      const parsedCached = cachedImgs ? JSON.parse(cachedImgs) : null;
      setImages(Array.isArray(parsedCached) && parsedCached.length > 0 ? parsedCached : (p.images ?? []));
      const cachedDesc = sessionStorage.getItem(`__edit_product_desc_images_${editId}`);
      const parsedDesc = cachedDesc ? JSON.parse(cachedDesc) : null;
      setDescImages(Array.isArray(parsedDesc) && parsedDesc.length > 0 ? parsedDesc : ((p as ExtendedProduct).description_images ?? []));
    } catch {
      setImages(p.images ?? []);
      setDescImages((p as ExtendedProduct).description_images ?? []);
    }
    setSelectedColors(p.colors ?? []);
    const detailTags = tags.filter((t) => t.startsWith("__detail:"));
    setProductDetails(detailTags.map((t) => {
      const parts = t.slice("__detail:".length).split(":");
      return { key: parts[0] ?? "", value: parts.slice(1).join(":") };
    }));
    const savedSizes = p.sizes ?? [];
    setSelectedSizes(savedSizes);
    const sstocks: Record<string, number> = {};
    tags.filter((t) => t.startsWith("__sstock:")).forEach((t) => {
      const [, size, qty] = t.split(":");
      if (size && qty) sstocks[size] = parseInt(qty) || 0;
    });
    setSizeStocks(sstocks);
    const guideT = guideTag === "__guide:shoes" ? "shoes" : guideTag === "__guide:clothing" ? "clothing" : guideTag === "__guide:custom" ? "custom" : "none";
    if (guideT === "custom") setCustomSizes(savedSizes);
    else setCustomSizes([]);
  }, [editId, products]);

  // ── Persist images to sessionStorage while filling forms ─────────────────
  // Covers both new-product and edit modes; survives full mobile page reload.
  useEffect(() => {
    if (!isNew && !editId) return;
    const key = editId ? `__edit_product_images_${editId}` : "__new_product_images";
    sessionStorage.setItem(key, JSON.stringify(images));
  }, [images, isNew, editId]);

  useEffect(() => {
    if (!isNew && !editId) return;
    const key = editId ? `__edit_product_desc_images_${editId}` : "__new_product_desc_images";
    sessionStorage.setItem(key, JSON.stringify(descImages));
  }, [descImages, isNew, editId]);

  // ── Restore images after mobile page reload ───────────────────────────────
  // This runs once after the reset effect above (effects run in definition order).
  useEffect(() => {
    if (!isNew) return;
    try {
      const imgs = sessionStorage.getItem("__new_product_images");
      if (imgs) { const p = JSON.parse(imgs); if (Array.isArray(p) && p.length > 0) setImages(p); }
      const desc = sessionStorage.getItem("__new_product_desc_images");
      if (desc) { const p = JSON.parse(desc); if (Array.isArray(p) && p.length > 0) setDescImages(p); }
    } catch { /* ignore malformed storage */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        ...Object.entries(sizeStocks).filter(([, qty]) => qty > 0).map(([s, qty]) => `__sstock:${s}:${qty}`),
        ...productDetails.filter((d) => d.key.trim()).map((d) => `__detail:${d.key.trim()}:${d.value.trim()}`),
      ],
      colors: selectedColors,
      sizes: selectedSizes,
      weight: form.weight ? parseFloat(form.weight) : null,
      description_images: descImages.filter(Boolean),
      video: form.video.trim() || null,
    };
    // ── Staff: route through approval queue ──────────────────────────────────
    if (isStaff) {
      const action = editId ? "update" : "create";
      const description = editId
        ? `Modification produit : ${payload.name}`
        : `Création produit : ${payload.name}`;
      const { submitted, error } = await submitForApproval({
        action,
        entity_type: "product",
        entity_id: editId ?? undefined,
        description,
        payload: payload as Record<string, unknown>,
        api_endpoint: editId ? `/api/products/${editId}` : "/api/products",
        api_method: editId ? "PUT" : "POST",
        preview_image: payload.images?.[0] ?? undefined,
      });
      setSaving(false);
      if (submitted) {
        sessionStorage.removeItem("__new_product_images");
        sessionStorage.removeItem("__new_product_desc_images");
        if (editId) { sessionStorage.removeItem(`__edit_product_images_${editId}`); sessionStorage.removeItem(`__edit_product_desc_images_${editId}`); }
        initializedEditIdRef.current = null;
        setMsg({ type: "ok", text: "✅ Soumis pour approbation — le propriétaire sera notifié." });
        setTimeout(() => router.replace("/admin/products"), 1500);
      } else {
        setMsg({ type: "err", text: error ?? "Erreur lors de la soumission" });
      }
      return;
    }

    // ── Owner: apply directly ─────────────────────────────────────────────────
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else {
      sessionStorage.removeItem("__new_product_images");
      sessionStorage.removeItem("__new_product_desc_images");
      if (editId) { sessionStorage.removeItem(`__edit_product_images_${editId}`); sessionStorage.removeItem(`__edit_product_desc_images_${editId}`); }
      initializedEditIdRef.current = null;
      setMsg({ type: "ok", text: editId ? "Produit mis à jour ✓" : "Produit créé ✓" });
      load();
      setTimeout(() => router.replace("/admin/products"), 1000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    if (isStaff) {
      const product = products.find(p => p.id === id);
      await submitForApproval({
        action: "delete",
        entity_type: "product",
        entity_id: id,
        description: `Suppression produit : ${product?.name ?? id}`,
        api_endpoint: `/api/products/${id}`,
        api_method: "DELETE",
        preview_image: product?.images?.[0] ?? undefined,
      });
      setMsg({ type: "ok", text: "✅ Demande de suppression soumise pour approbation." });
      return;
    }
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
    : sizeGuideType === "custom" ? customSizes
    : form.category === "chaussures" ? SHOE_SIZES
    : CLOTHING_SIZES;

  function addCustomSize() {
    const val = customSizeInput.trim().toUpperCase();
    if (!val || customSizes.includes(val)) { setCustomSizeInput(""); return; }
    setCustomSizes((prev) => [...prev, val]);
    setSelectedSizes((prev) => [...prev, val]);
    setCustomSizeInput("");
  }

  function removeCustomSize(s: string) {
    setCustomSizes((prev) => prev.filter((x) => x !== s));
    setSelectedSizes((prev) => prev.filter((x) => x !== s));
    setSizeStocks((prev) => { const n = { ...prev }; delete n[s]; return n; });
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });
  const activeProducts = products.filter((product) => product.active).length;
  const outOfStockProducts = products.filter((product) => product.stock === 0).length;
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);

  const [aiUrl, setAiUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleAiImport() {
    if (!aiUrl.startsWith("http")) return;
    setAiLoading(true);
    setAiMsg(null);
    try {
      const res = await fetch("/api/ai-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: aiUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setAiMsg({ type: "err", text: data.error ?? "Erreur" }); return; }

      // Fill form fields
      if (data.name) {
        const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        setForm(f => ({ ...f,
          name: data.name ?? f.name,
          description: data.description ?? f.description,
          brand: data.brand ?? f.brand,
          price: data.price ? String(data.price) : f.price,
          category: ["homme","femme","chaussures","accessoires"].includes(data.category) ? data.category : f.category,
          tags: data.tags ?? f.tags,
          slug: slug || f.slug,
        }));
      }
      if (data.colors) {
        const cols = data.colors.split(",").map((c: string) => c.trim()).filter((c: string) =>
          AVAILABLE_COLORS.some(ac => ac.label.toLowerCase() === c.toLowerCase())
        );
        if (cols.length) setSelectedColors(cols.map((c: string) =>
          AVAILABLE_COLORS.find(ac => ac.label.toLowerCase() === c.toLowerCase())?.label ?? c
        ));
      }
      // Auto-fill images extracted from the product page
      if (Array.isArray(data.images) && data.images.length > 0) {
        setImages(data.images);
      }
      const imgCount = Array.isArray(data.images) ? data.images.length : 0;
      const noAi = data._noAi === true;
      setAiMsg({ type: "ok", text: noAi
        ? `✓ Titre et ${imgCount} image${imgCount !== 1 ? "s" : ""} importés ! (IA non disponible — ajoutez une clé OpenAI pour la description auto)`
        : `✓ Fiche générée${imgCount > 0 ? ` + ${imgCount} image${imgCount > 1 ? "s" : ""} importée${imgCount > 1 ? "s" : ""}` : ""} ! Vérifiez et complétez les champs.`
      });
      setAiUrl("");
    } catch {
      setAiMsg({ type: "err", text: "Erreur de connexion" });
    } finally {
      setAiLoading(false);
    }
  }

  function closeEditor() {
    sessionStorage.removeItem("__new_product_images");
    sessionStorage.removeItem("__new_product_desc_images");
    if (editId) {
      sessionStorage.removeItem(`__edit_product_images_${editId}`);
      sessionStorage.removeItem(`__edit_product_desc_images_${editId}`);
    }
    initializedEditIdRef.current = null;
    router.replace("/admin/products");
  }

  const editorRequirements = [
    Boolean(form.name.trim()),
    Boolean(form.slug.trim()),
    Boolean(form.price && Number(form.price) > 0),
    Boolean(form.category),
    images.length > 0,
  ];
  const editorCompletion = Math.round(
    editorRequirements.filter(Boolean).length / editorRequirements.length * 100
  );
  const previewStock = Math.max(0, Number(form.stock) || 0);
  const previewDiscount = form.price && form.original_price && Number(form.original_price) > Number(form.price)
    ? Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)
    : 0;
  const previewColors = selectedColors
    .map((color) => AVAILABLE_COLORS.find((item) => item.label === color))
    .filter((color): color is (typeof AVAILABLE_COLORS)[number] => Boolean(color));
  const editorPreview = (
    <div className="group relative overflow-hidden rounded-[26px] border border-neutral-800/90 bg-[#090b0a] text-white shadow-[0_22px_55px_rgba(0,0,0,.2)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-400/[.09] blur-3xl" />
      <div className="relative flex items-center justify-between border-b border-white/[.08] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ecf4c] opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3ecf4c]" />
          </span>
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/60">Aperçu boutique</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-white/45">Vue client</span>
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="relative flex h-36 w-[7.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-white/[.09] to-white/[.025] ring-1 ring-inset ring-white/10">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt="Aperçu du produit" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/25">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.04]">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[.12em]">Photo produit</span>
              </div>
            )}
            {form.featured && <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-300 px-2 py-1 text-[7px] font-black uppercase tracking-[.08em] text-black shadow-lg">Vedette</span>}
            {images.length > 1 && <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 px-2 py-1 text-[8px] font-black backdrop-blur-md">+{images.length - 1}</span>}
          </div>

          <div className="flex min-w-0 flex-1 flex-col py-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-black uppercase tracking-[.18em] text-[#58df67]">{form.category || "Catégorie"}</p>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[.08em] ${previewStock > 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                {previewStock > 0 ? "En stock" : "Épuisé"}
              </span>
            </div>
            <h3 className={`mt-2.5 line-clamp-2 text-[15px] font-black leading-5 tracking-[-.02em] ${form.name.trim() ? "text-white" : "text-white/55"}`}>{form.name.trim() || "Nom de votre produit"}</h3>
            <p className="mt-1 truncate text-[10px] font-medium text-white/35">{form.brand.trim() || "Marque du produit"}</p>
            <div className="mt-3 flex min-h-5 items-center gap-1.5">
              {previewColors.length > 0 ? previewColors.slice(0, 4).map((color) => (
                <span key={color.label} title={color.label} className="h-4 w-4 rounded-full border-2 border-[#090b0a] ring-1 ring-white/20" style={{ backgroundColor: color.hex }} />
              )) : <span className="text-[9px] text-white/25">Ajoutez des variantes couleur</span>}
              {previewColors.length > 4 && <span className="ml-0.5 text-[8px] font-bold text-white/35">+{previewColors.length - 4}</span>}
            </div>
            <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-1 pt-3">
              <span className={`text-xl font-black tracking-[-.04em] ${form.price && Number(form.price) > 0 ? "text-white" : "text-white/45"}`}>{form.price && Number(form.price) > 0 ? Number(form.price).toLocaleString("fr-MA") : "—"}<span className="ml-1 text-[10px] tracking-normal text-white/55">MAD</span></span>
              {previewDiscount > 0 && <><span className="pb-1 text-[9px] text-white/30 line-through">{Number(form.original_price).toLocaleString("fr-MA")} MAD</span><span className="mb-0.5 rounded-md bg-[#3ecf4c] px-1.5 py-0.5 text-[8px] font-black text-black">-{previewDiscount}%</span></>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-white/[.08] pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">Disponibilité</p>
            <p className="mt-0.5 truncate text-[10px] font-bold text-white/65">{previewStock > 0 ? `${previewStock} unité${previewStock > 1 ? "s" : ""} disponible${previewStock > 1 ? "s" : ""}` : "Indisponible à la commande"}</p>
          </div>
          <span className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black transition ${previewStock > 0 ? "bg-white text-black shadow-[0_8px_22px_rgba(255,255,255,.08)]" : "cursor-not-allowed bg-white/[.07] text-white/30"}`}>
            Voir la fiche
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </div>
      </div>
    </div>
  );

  if (showForm) return (
    <div className="mx-auto w-full max-w-[1440px] pb-28 lg:pb-12">
      <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-neutral-200/80 bg-[#f6f6f4]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mb-7 lg:rounded-[26px] lg:border lg:bg-white lg:p-5 lg:shadow-[0_12px_35px_rgba(0,0,0,.055)]">
        <div className="flex items-center gap-3">
        <button type="button" onClick={closeEditor} aria-label="Retour aux produits" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-black hover:text-black">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-black tracking-[-.025em] sm:text-xl lg:text-2xl">{editId ? "Modifier le produit" : "Nouveau produit"}</h1>
            <span className={`hidden rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] sm:inline-flex ${form.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{form.active ? "Visible" : "Brouillon"}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-neutral-400 sm:text-xs">{editId ? "Mettez à jour la fiche, les médias et l’inventaire." : "Créez une fiche claire, complète et prête à vendre."}</p>
        </div>
        <div className="hidden w-44 xl:block">
          <div className="mb-1.5 flex items-center justify-between text-[9px] font-black uppercase tracking-[.12em] text-neutral-400"><span>Fiche complétée</span><span className="text-neutral-900">{editorCompletion}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-[#3ecf4c] transition-[width] duration-500" style={{ width: `${editorCompletion}%` }} /></div>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={closeEditor} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-xs font-black text-neutral-600 transition hover:border-black hover:text-black">Annuler</button>
          <button type="submit" form="product-editor-form" disabled={saving} className="inline-flex min-h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50">
            {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Enregistrement…</> : editId ? "Enregistrer" : "Créer le produit"}
          </button>
        </div>
        </div>
        <div className="mt-3 flex items-center gap-3 lg:hidden">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full bg-[#3ecf4c] transition-[width] duration-500" style={{ width: `${editorCompletion}%` }} /></div>
          <span className="text-[9px] font-black text-neutral-500">{editorCompletion}%</span>
        </div>
      </div>

      <form id="product-editor-form" onSubmit={handleSave}>
        <div className="mb-5 hidden grid-cols-4 gap-2 lg:grid">
          {[
            ["01", "Informations", Boolean(form.name && form.slug)],
            ["02", "Médias", images.length > 0],
            ["03", "Vente & stock", Boolean(form.price)],
            ["04", "Variantes", selectedColors.length > 0 || selectedSizes.length > 0],
          ].map(([step, label, complete]) => (
            <div key={String(step)} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${complete ? "border-emerald-100 bg-emerald-50/70" : "border-neutral-200 bg-white"}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-[9px] font-black ${complete ? "bg-[#3ecf4c] text-black" : "bg-neutral-100 text-neutral-400"}`}>{step}</span>
              <span className={`text-[10px] font-black uppercase tracking-[.1em] ${complete ? "text-emerald-800" : "text-neutral-400"}`}>{label}</span>
            </div>
          ))}
        </div>
        {/* ── AI IMPORT BANNER ── */}
        <div className="relative mb-5 overflow-hidden rounded-[24px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4 shadow-[0_8px_30px_rgba(109,40,217,.06)] sm:p-5">
            <div aria-hidden="true" className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <p className="text-sm font-black text-violet-900">Import IA depuis AliExpress / Temu / Amazon</p>
                <p className="text-[11px] text-violet-600">Collez un lien produit — l'IA génère automatiquement nom, description, catégorie, tags <strong>et importe les images</strong></p>
              </div>
            </div>
            <div className="relative flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={aiUrl}
                onChange={e => setAiUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAiImport())}
                placeholder="https://www.aliexpress.com/item/... ou https://www.temu.com/..."
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={handleAiImport}
                disabled={aiLoading || !aiUrl.startsWith("http")}
                className="flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-700 disabled:opacity-50"
              >
                {aiLoading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Génération…</>
                ) : (
                  <>✨ Générer avec IA</>
                )}
              </button>
            </div>
            {aiMsg && (
              <p className={`mt-2 text-xs font-semibold ${aiMsg.type === "ok" ? "text-green-700" : "text-red-600"}`}>{aiMsg.text}</p>
            )}
          </div>
        <div className="mb-5 lg:hidden">{editorPreview}</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-6">
          {/* ── LEFT ── */}
          <div className="space-y-4">
            {/* General info */}
            <div className="space-y-5 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-[10px] font-black text-[#3ecf4c]">01</span>
                <div><h2 className="text-xs font-black uppercase tracking-[.16em] text-neutral-800">Informations générales</h2><p className="mt-0.5 text-[10px] text-neutral-400">Identité, description et référencement du produit</p></div>
              </div>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Slug URL *</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <span className="border-r border-neutral-200 bg-neutral-100/80 px-3 py-3 text-xs font-semibold text-neutral-400">/produit/</span>
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

            {/* Product Details */}
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Détails du produit</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Ex: Matière, Coupe, Entretien, Origine…</p>
                </div>
                <button type="button"
                  onClick={() => setProductDetails((p) => [...p, { key: "", value: "" }])}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-black border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter
                </button>
              </div>
              {productDetails.length === 0 ? (
                <p className="text-[12px] text-neutral-300 italic text-center py-4">Aucun détail ajouté</p>
              ) : (
                <div className="space-y-2">
                  {productDetails.map((detail, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-2 sm:grid-cols-[140px_auto_minmax(0,1fr)_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
                      <input
                        type="text"
                        value={detail.key}
                        onChange={(e) => setProductDetails((p) => p.map((d, j) => j === i ? { ...d, key: e.target.value } : d))}
                        placeholder="Ex: Matière"
                        className="min-h-10 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold outline-none transition focus:border-black sm:w-full"
                      />
                      <span className="hidden shrink-0 text-xs text-neutral-300 sm:block">:</span>
                      <input
                        type="text"
                        value={detail.value}
                        onChange={(e) => setProductDetails((p) => p.map((d, j) => j === i ? { ...d, value: e.target.value } : d))}
                        placeholder="Ex: 100% coton biologique"
                        className="min-h-10 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-black"
                      />
                      <button type="button"
                        onClick={() => setProductDetails((p) => p.filter((_, j) => j !== i))}
                        className="row-span-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500 sm:row-span-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-[10px] font-black text-[#3ecf4c]">03</span>
                <div><h2 className="text-xs font-black uppercase tracking-[.16em] text-neutral-800">Tarification &amp; Stock</h2><p className="mt-0.5 text-[10px] text-neutral-400">Prix de vente, remise et inventaire disponible</p></div>
              </div>
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
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
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Guide de tailles :</span>
                {(["none", "clothing", "shoes", "custom"] as const).map((opt) => {
                  const labels = { none: "Aucun", clothing: "Vêtements", shoes: "Chaussures", custom: "Personnalisé" };
                  return (
                    <button key={opt} type="button" onClick={() => { setSizeGuideType(opt); setSelectedSizes([]); if (opt !== "custom") setCustomSizes([]); }}
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
                <>
                  {/* Custom size input (shown for "custom" guide type) */}
                  {sizeGuideType === "custom" && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                        placeholder="Ex: XS, 42, 6 mois, Unique…"
                        className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all"
                      />
                      <button type="button" onClick={addCustomSize}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors whitespace-nowrap">
                        + Ajouter
                      </button>
                    </div>
                  )}

                  {/* Select all / clear all */}
                  {sizeSet.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <button type="button" onClick={() => setSelectedSizes([...sizeSet])}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-black underline underline-offset-2 transition-colors">
                        Tout sélectionner
                      </button>
                      <span className="text-neutral-300">·</span>
                      <button type="button" onClick={() => setSelectedSizes([])}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-black underline underline-offset-2 transition-colors">
                        Tout désélectionner
                      </button>
                      {selectedSizes.length > 0 && (
                        <span className="ml-auto text-[11px] font-bold text-neutral-400">{selectedSizes.length} / {sizeSet.length} sélectionnée{selectedSizes.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  )}

                  {/* Size buttons */}
                  <div className="flex flex-wrap gap-2">
                    {sizeSet.map((s) => {
                      const active = selectedSizes.includes(s);
                      return (
                        <div key={s} className="flex flex-col items-center gap-1">
                          <button type="button" onClick={() => toggleSize(s)}
                            className={`min-w-[3rem] px-3 h-10 rounded-xl border text-xs font-bold transition-all ${
                              active ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                            }`}>
                            {s}
                          </button>
                          {sizeGuideType === "custom" && (
                            <button type="button" onClick={() => removeCustomSize(s)}
                              className="text-[9px] text-red-400 hover:text-red-600 transition-colors leading-none">
                              ✕ retirer
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {sizeGuideType === "custom" && customSizes.length === 0 && (
                      <p className="text-xs text-neutral-400 italic">Ajoutez des tailles via le champ ci-dessus.</p>
                    )}
                  </div>

                  {/* Per-size stock */}
                  {selectedSizes.length > 0 && (
                    <div className="mt-5 border-t border-neutral-100 pt-4">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Stock par taille <span className="normal-case font-normal text-neutral-300">(optionnel)</span></p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedSizes.map((s) => (
                          <div key={s} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2">
                            <span className="text-xs font-black text-neutral-700 w-8 shrink-0">{s}</span>
                            <button type="button" onClick={() => setSizeStocks((p) => ({ ...p, [s]: Math.max(0, (p[s] ?? 0) - 1) }))}
                              className="text-neutral-400 hover:text-black transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                            <input type="number" min="0" value={sizeStocks[s] ?? ""}
                              onChange={(e) => setSizeStocks((p) => ({ ...p, [s]: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                              className="flex-1 w-0 text-center text-xs font-semibold focus:outline-none bg-transparent" />
                            <button type="button" onClick={() => setSizeStocks((p) => ({ ...p, [s]: (p[s] ?? 0) + 1 }))}
                              className="text-neutral-400 hover:text-black transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">
            <div className="hidden lg:block">{editorPreview}</div>
            {/* Images */}
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-black text-[9px] font-black text-[#3ecf4c]">02</span><h2 className="text-xs font-black uppercase tracking-[.16em] text-neutral-800">Images produit</h2></div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">{images.length} photo{images.length !== 1 ? "s" : ""}</span>
              </div>
              <input ref={fileInputRef} id="img-upload-main" type="file" accept="image/*,image/heic,image/heif" multiple className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
              <label
                htmlFor={uploading ? undefined : "img-upload-main"}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
                className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"} ${uploading ? "pointer-events-none opacity-70" : ""}`}>
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
                    <p className="text-xs font-semibold text-neutral-700">Appuyer ou glisser des images</p>
                    <p className="text-[10px] text-neutral-400">JPG, PNG, WEBP, AVIF, HEIC — max 15 MB</p>
                  </div>
                )}
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-black bg-black text-white px-1.5 py-0.5 rounded-full">MAIN</span>}
                      <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
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
            <div className="space-y-3 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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

            {/* Description Images */}
            <div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Images de description</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">{descImages.length} photo{descImages.length !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-4">Photos affichées dans la section description du produit (détails, matières, lifestyle…)</p>
              <input ref={descFileInputRef} id="img-upload-desc" type="file" accept="image/*,image/heic,image/heif" multiple className="hidden"
                onChange={(e) => e.target.files && uploadDescFiles(e.target.files)} />
              <label
                htmlFor={uploadingDesc ? undefined : "img-upload-desc"}
                onDragOver={(e) => { e.preventDefault(); setDragOverDesc(true); }}
                onDragLeave={() => setDragOverDesc(false)}
                onDrop={(e) => { e.preventDefault(); setDragOverDesc(false); uploadDescFiles(e.dataTransfer.files); }}
                className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3 ${dragOverDesc ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"} ${uploadingDesc ? "pointer-events-none opacity-70" : ""}`}>
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
                    <p className="text-xs font-semibold text-neutral-700">Appuyer ou glisser des images</p>
                    <p className="text-[10px] text-neutral-400">JPG, PNG, WEBP, AVIF, HEIC — max 15 MB</p>
                  </div>
                )}
              </label>
              {descImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {descImages.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200" style={{ aspectRatio: "4/3" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

            {/* Status & Options */}
            <div className="space-y-4 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-12px_35px_rgba(0,0,0,.1)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <button type="button" onClick={closeEditor} className="min-h-12 rounded-xl border border-neutral-200 px-4 text-xs font-black text-neutral-600">Annuler</button>
            <button type="submit" disabled={saving} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-black text-white shadow-lg disabled:opacity-50">
              {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Enregistrement…</> : editId ? "Enregistrer les modifications" : "Créer le produit"}
            </button>
          </div>
        </div>
        <style jsx global>{`
          #product-editor-form input:not([type="file"]):focus,
          #product-editor-form textarea:focus,
          #product-editor-form select:focus {
            border-color: #171717;
            box-shadow: 0 0 0 4px rgba(23, 23, 23, 0.06);
          }
          #product-editor-form input::placeholder,
          #product-editor-form textarea::placeholder {
            color: #a3a3a3;
          }
          @media (prefers-reduced-motion: reduce) {
            #product-editor-form * { scroll-behavior: auto !important; }
          }
        `}</style>
      </form>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl pb-12">
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-52 w-52 rounded-full bg-[#3ecf4c]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-[#3ecf4c] shadow-lg shadow-black/10">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
          </div>
          <div>
          <div className="mb-1.5 flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight sm:text-[28px]">Produits</h1>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">{products.length} au total</span>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
            {isStaff
              ? `${products.length} produit${products.length !== 1 ? "s" : ""} approuvé${products.length !== 1 ? "s" : ""} · vos ajouts uniquement`
              : "Gérez votre catalogue, vos tarifs et votre inventaire depuis un seul espace."}
          </p>
          </div>
        </div>
        <button onClick={() => router.push("/admin/products?new=1")}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-neutral-800">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau produit
        </button>
        </div>
      </div>

      {msg?.type === "err" && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold">{msg.text}</p>
          <button type="button" onClick={() => void load()} className="min-h-10 rounded-xl bg-red-700 px-4 text-xs font-black text-white">Réessayer</button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Produits actifs", value: activeProducts, detail: `${products.length - activeProducts} masqué${products.length - activeProducts !== 1 ? "s" : ""}`, tone: "emerald", icon: <path d="m5 12 4 4L19 6"/> },
          { label: "Stock faible", value: lowStockProducts, detail: "5 unités ou moins", tone: "amber", icon: <path d="M12 9v4M12 17h.01"/> },
          { label: "Ruptures", value: outOfStockProducts, detail: "À réapprovisionner", tone: "red", icon: <path d="M18 6 6 18M6 6l12 12"/> },
          { label: "Valeur du stock", value: `${inventoryValue.toLocaleString("fr-MA")} MAD`, detail: "Au prix de vente", tone: "neutral", icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6"/> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.025)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-400">{stat.label}</p>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.tone === "emerald" ? "bg-emerald-50 text-emerald-600" : stat.tone === "amber" ? "bg-amber-50 text-amber-600" : stat.tone === "red" ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600"}`}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">{stat.icon}</svg></span>
            </div>
            <p className="truncate text-xl font-black tracking-tight sm:text-2xl">{stat.value}</p>
            <p className="mt-1 text-[10px] text-neutral-400 sm:text-[11px]">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals banner — staff only */}
      {isStaff && pendingProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm font-bold text-amber-800">
              {pendingProducts.length} demande{pendingProducts.length > 1 ? "s" : ""} en attente d&apos;approbation
            </p>
          </div>
          <div className="space-y-2">
            {pendingProducts.map((pending) => {
              const pl = pending.payload as Record<string, unknown> | null;
              const img = Array.isArray(pl?.images) ? (pl!.images as string[])[0] : null;
              const name = typeof pl?.name === "string" ? pl.name : pending.description;
              const actionLabel = pending.action === "create" ? "Nouveau produit" : pending.action === "update" ? "Modification" : "Suppression";
              return (
                <div key={pending.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-amber-100">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={img} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{name}</p>
                    <p className="text-[11px] text-neutral-400">{actionLabel} · en attente de validation</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0 whitespace-nowrap">
                    En attente
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.025)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/[.04]" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => router.replace(c === "all" ? "/admin/products" : `/admin/products?cat=${c}`)}
            className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${filterCat === c ? "bg-black text-white shadow-md shadow-black/10" : "border border-neutral-200 bg-white text-neutral-600 hover:border-black"}`}>
            {c === "all" ? "Tous" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        </div>
        {/* Scroll arrows for the table below */}
        <div className="ml-auto hidden shrink-0 items-center gap-1.5 md:flex">
          <button
            onClick={() => scrollTable("left")}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-all text-neutral-500 hover:text-black"
            aria-label="Défiler à gauche"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => scrollTable("right")}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-all text-neutral-500 hover:text-black"
            aria-label="Défiler à droite"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 px-1 pt-3 text-[11px] text-neutral-400">
        <span><strong className="text-neutral-700">{filtered.length}</strong> résultat{filtered.length !== 1 ? "s" : ""}</span>
        {(search || filterCat !== "all") && <button type="button" onClick={() => { setSearch(""); router.replace("/admin/products"); }} className="font-bold text-neutral-600 hover:text-black">Réinitialiser les filtres</button>}
      </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          {isStaff ? (
            <>
              <div className="text-4xl mb-3">📦</div>
              <p className="text-neutral-700 font-bold text-sm">Aucun produit approuvé pour l&apos;instant</p>
              <p className="text-neutral-400 text-xs mt-1 max-w-xs mx-auto">
                Vos produits apparaîtront ici une fois approuvés par l&apos;administrateur.
                {pendingProducts.length > 0 && ` Vous avez ${pendingProducts.length} demande${pendingProducts.length > 1 ? "s" : ""} en attente.`}
              </p>
              <button onClick={() => router.push("/admin/products?new=1")} className="mt-4 text-sm font-bold text-black underline underline-offset-2">
                Soumettre un nouveau produit →
              </button>
            </>
          ) : (
            <>
              <p className="text-neutral-500 text-sm">Aucun produit trouvé</p>
              <button onClick={() => router.push("/admin/products?new=1")} className="mt-3 text-sm font-bold text-black underline underline-offset-2">Créer le premier produit</button>
            </>
          )}
        </div>
      ) : (
        <>
        <div ref={tableRef} className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.025)] md:block">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left">
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
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100">
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-neutral-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[360px] truncate text-sm font-bold">{p.name} {p.featured && <span className="text-yellow-400">★</span>}</p>
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
                    {isStaff ? (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {p.active ? "Actif" : "Inactif"}
                      </span>
                    ) : (
                    <button onClick={() => toggleActive(p)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${p.active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                      {p.active ? "Actif" : "Inactif"}
                    </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/produit/${p.slug}`} target="_blank"
                        aria-label={`Voir ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-white hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button onClick={() => router.push(`/admin/products?id=${p.id}`)}
                        aria-label={`Modifier ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-white hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                        aria-label={`Supprimer ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600">
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
        <div className="space-y-3 md:hidden">
          {filtered.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
              <div className="flex gap-3 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100">
                  {p.images?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-neutral-300"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-black leading-snug">{p.name} {p.featured && <span className="text-yellow-400">★</span>}</p>
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${p.active ? "bg-emerald-500" : "bg-neutral-300"}`} />
                  </div>
                  <p className="truncate text-[10px] text-neutral-400">{p.brand ? `${p.brand} · ` : ""}{p.slug}</p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div><p className="text-base font-black">{p.price} MAD</p>{p.original_price && <p className="text-[10px] text-neutral-400 line-through">{p.original_price} MAD</p>}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${p.stock === 0 ? "bg-red-50 text-red-600" : p.stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{p.stock === 0 ? "Épuisé" : `${p.stock} en stock`}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-neutral-100 bg-neutral-50/60 p-2.5">
                <span className="mr-auto rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold capitalize text-neutral-600 ring-1 ring-neutral-200">{p.category}</span>
                <Link href={`/produit/${p.slug}`} target="_blank" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-neutral-500 ring-1 ring-neutral-200" aria-label={`Voir ${p.name}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg></Link>
                <button onClick={() => router.push(`/admin/products?id=${p.id}`)} className="flex h-9 items-center gap-2 rounded-xl bg-black px-3 text-[10px] font-black text-white"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>Modifier</button>
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 disabled:opacity-50" aria-label={`Supprimer ${p.name}`}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/></svg></button>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
