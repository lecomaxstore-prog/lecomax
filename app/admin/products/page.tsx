"use client";
import AdminToggle from "@/components/admin/AdminToggle";
import AdminLoading from "@/components/admin/AdminLoading";
import ProductSizeGuideEditor from "@/components/admin/ProductSizeGuideEditor";
import { productSizeGuideFromTags, withProductSizeGuide, PRODUCT_SIZE_GUIDE_PREFIX, type ProductSizeGuide } from "@/mobile/src/lib/product-size-guide";
import MobileSection from "@/components/admin/MobileSection";
import ActionMenu from "@/components/admin/ActionMenu";
import FilterPanel from "@/components/admin/FilterPanel";
import Pagination, { useAdminPagination } from "@/components/admin/Pagination";
import { useSettings as useCentralSettings } from "@/lib/use-settings";
import { storeSettings as centralStoreSettings } from "@/lib/store-settings";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase";
import { preorderCopy } from "@/lib/preorder-copy";
import Link from "next/link";
import { useApproval } from "@/lib/use-approval";
import { colorPricesFromTags, colorPriceTags, type ColorPrice } from "@/lib/product-variant-pricing";
import {
  CLOTHING_SIZE_VALUES,
  SHOE_SIZE_VALUES,
  colorSizeStockFromTags,
  colorSizeStockTotal,
  colorTotalsFromColorSizeStock,
  sizeStockFromTags,
  sizeStockTotal,
  sizeTotalsFromColorSizeStock,
  type ColorSizeStock,
  type ProductSizeGuideType,
} from "@/lib/product-inventory";
import { colorImageMapFromTags, type ProductColorImageMap } from "@/lib/product-color-images";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import ProductBulkActions from '@/components/admin/ProductBulkActions';
import { useAdminConfirmation } from '@/components/admin/ConfirmDialog';

function DuplicateButton({pending,onClick}:{pending:boolean;onClick:()=>void}) {
  return <button type="button" onClick={onClick} disabled={pending} className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-[11px] font-bold disabled:opacity-50">{pending ? "Copie?" : "Dupliquer"}</button>;
}

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

const CLOTHING_SIZES: string[] = [...CLOTHING_SIZE_VALUES];
const SHOE_SIZES: string[] = [...SHOE_SIZE_VALUES];

const emptyForm = {
  slug: "", name: "", brand: "", category: "homme", price: "", original_price: "",
  description: "", stock: "0", active: true, featured: false,
  preorder_enabled: false, preorder_estimated_at: "", preorder_message: "",
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
  color_stock?: Record<string, number> | null;
};

export default function ProductsPage() {
  const { confirm: confirmAction, dialog: confirmationDialog } = useAdminConfirmation();
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const selectProduct = (id: string) => setBulkSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else if (next.size < 25) next.add(id);
    return next;
  });
  const lowStockThreshold = Number(centralStoreSettings(useCentralSettings()).low_stock_threshold);
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
  const [colorImagesByColor, setColorImagesByColor] = useState<ProductColorImageMap>({});
  const [colorStocks, setColorStocks] = useState<Record<string, number>>({});
  const [colorPrices, setColorPrices] = useState<Record<string, ColorPrice>>({});
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeGuideType, setSizeGuideType] = useState<ProductSizeGuideType>("none");
  const [productSizeGuide, setProductSizeGuide] = useState<ProductSizeGuide | null>(null);
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [colorSizeStocks, setColorSizeStocks] = useState<ColorSizeStock>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);  const [descImages, setDescImages] = useState<string[]>([]);
  const [uploadingDesc, setUploadingDesc] = useState(false);
  const [dragOverDesc, setDragOverDesc] = useState(false);
  const descFileInputRef = useRef<HTMLInputElement>(null);
  const [productDetails, setProductDetails] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
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
  useEffect(() => {
    document.getElementById("admin-main")?.scrollTo({ top: 0 });
  }, [showForm, editId]);

  function jumpToSection(id: string) {
    const section = document.getElementById(id);
    if (!section) return;
    if (section instanceof HTMLDetailsElement) section.open = true;
    requestAnimationFrame(() => section.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const editorSnapshot = JSON.stringify({ form, images, descImages, selectedColors, colorImagesByColor, colorStocks, colorPrices, selectedSizes, sizeGuideType, sizeStocks, colorSizeStocks, productDetails, productSizeGuide });
  const latestEditorSnapshot = useRef(editorSnapshot);
  latestEditorSnapshot.current = editorSnapshot;
  const [savedEditorSnapshot, setSavedEditorSnapshot] = useState<string | null>(null);
  useEffect(() => {
    setSavedEditorSnapshot(null);
    if (!showForm || loading) return;
    // Initialization effects populate the editor in the next render.
    const timer = setTimeout(() => setSavedEditorSnapshot(latestEditorSnapshot.current), 0);
    return () => clearTimeout(timer);
  }, [showForm, editId, isNew, loading]);
  const editorDirty = showForm && savedEditorSnapshot !== null && editorSnapshot !== savedEditorSnapshot;
  useUnsavedChanges(editorDirty);

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
    setColorImagesByColor({});
    setColorStocks({});
    setColorPrices({});
    setSelectedSizes([]);
    setSizeGuideType("none");
    setProductSizeGuide(null);
    setCustomSizes([]);
    setSizeStocks({});
    setColorSizeStocks({});
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
    const savedSizes = p.sizes ?? [];
    const inferredGuideType: ProductSizeGuideType =
      guideTag === "__guide:shoes" ? "shoes"
      : guideTag === "__guide:clothing" ? "clothing"
      : guideTag === "__guide:custom" ? "custom"
      : p.category === "chaussures" || (savedSizes.length > 0 && savedSizes.every((size) => SHOE_SIZES.includes(size))) ? "shoes"
      : savedSizes.length > 0 && savedSizes.every((size) => CLOTHING_SIZES.includes(size)) ? "clothing"
      : savedSizes.length > 0 ? "custom"
      : "none";
    setSizeGuideType(inferredGuideType);
    setProductSizeGuide(productSizeGuideFromTags(tags));
    setForm({
      slug: p.slug, name: p.name, brand: p.brand ?? "",
      category: p.category,
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      description: p.description ?? "",
      preorder_enabled: p.preorder_enabled === true, preorder_estimated_at: p.preorder_estimated_at ?? "", preorder_message: p.preorder_message ?? "",
      stock: String(p.stock), active: p.active,
      featured: p.featured ?? false,
      tags: tags.filter((t) => !t.startsWith(PRODUCT_SIZE_GUIDE_PREFIX) && !t.startsWith("__guide:") && !t.startsWith("__sstock:") && !t.startsWith("__vstock:") && !t.startsWith("__detail:") && !t.startsWith("__cprice:") && !t.startsWith("__cimages:") && !t.startsWith("__oos:")).join(", "),
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
    const savedColorImages = colorImageMapFromTags(tags);
    setColorImagesByColor(Object.keys(savedColorImages).length > 0
      ? savedColorImages
      : Object.fromEntries((p.colors ?? []).flatMap((color, index) => p.images?.[index] ? [[color, [p.images[index]]]] : [])));
    setColorStocks(p.color_stock ?? {});
    setColorPrices(colorPricesFromTags(tags));
    const detailTags = tags.filter((t) => t.startsWith("__detail:"));
    setProductDetails(detailTags.map((t) => {
      const parts = t.slice("__detail:".length).split(":");
      return { key: parts[0] ?? "", value: parts.slice(1).join(":") };
    }));
    setSelectedSizes(savedSizes);
    const sstocks = sizeStockFromTags(tags);
    setSizeStocks(sstocks);
    setColorSizeStocks(colorSizeStockFromTags(tags));
    setCustomSizes(savedSizes.filter(size => !SHOE_SIZES.includes(size) && !CLOTHING_SIZES.includes(size)));
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
    if (saving || uploading || uploadingDesc) return;
    setSaving(true);
    setMsg(null);
    try {
    const selectedColorStocks = Object.fromEntries(selectedColors.map((color) => [color, Math.max(0, Math.trunc(colorStocks[color] ?? 0))]));
    const hasColorSizeStock = selectedColors.some((color) => selectedSizes.some((size) => Object.prototype.hasOwnProperty.call(colorSizeStocks[color] ?? {}, size)));
    const selectedColorSizeStocks = Object.fromEntries(selectedColors.map((color) => [color, Object.fromEntries(selectedSizes.map((size) => [size, Math.max(0, Math.trunc(colorSizeStocks[color]?.[size] ?? 0))]))]));
    const hasPerSizeStock = selectedSizes.some((size) => Object.prototype.hasOwnProperty.call(sizeStocks, size));
    const selectedSizeStocks = hasColorSizeStock ? sizeTotalsFromColorSizeStock(selectedColorSizeStocks) : Object.fromEntries(selectedSizes.map((size) => [size, Math.max(0, Math.trunc(sizeStocks[size] ?? 0))]));
    const effectiveColorStocks = hasColorSizeStock ? colorTotalsFromColorSizeStock(selectedColorSizeStocks) : selectedColorStocks;
    const selectedColorPrices = Object.fromEntries(selectedColors.filter((color) => colorPrices[color]).map((color) => [color, colorPrices[color]]));
    const selectedColorImages = Object.fromEntries(selectedColors.map((color) => [
      color,
      (colorImagesByColor[color] ?? []).filter((image) => images.includes(image)),
    ]));
    const variantStockTotal = Object.values(selectedColorStocks).reduce((total, quantity) => total + quantity, 0);
    const variantPriceValues = Object.values(selectedColorPrices).map((value) => value.price).filter((value) => Number.isFinite(value) && value >= 0);
    const cataloguePrice = variantPriceValues.length ? Math.min(...variantPriceValues) : parseFloat(form.price);
    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      price: cataloguePrice,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      description: form.description.trim() || null,
      images: images.filter(Boolean),
      stock: hasColorSizeStock ? colorSizeStockTotal(selectedColorSizeStocks) : selectedColors.length ? variantStockTotal : hasPerSizeStock ? sizeStockTotal(selectedSizeStocks) : parseInt(form.stock) || 0,
      color_stock: selectedColors.length ? effectiveColorStocks : {},
      preorder_enabled: form.preorder_enabled, preorder_estimated_at: form.preorder_estimated_at || null, preorder_message: form.preorder_message || null,
      active: form.active,
      featured: form.featured,
      tags: withProductSizeGuide([
        ...form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        ...productDetails.filter((d) => d.key.trim()).map((d) => `__detail:${d.key.trim()}:${d.value.trim()}`),
        ...colorPriceTags(selectedColorPrices),
      ], productSizeGuide),
      colors: selectedColors,
      color_images: selectedColorImages,
      sizes: selectedSizes,
      size_guide_type: sizeGuideType,
      ...(hasPerSizeStock || hasColorSizeStock ? { size_stock: selectedSizeStocks } : {}),
      ...(hasColorSizeStock ? { variant_stock: selectedColorSizeStocks } : {}),
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
        setSavedEditorSnapshot(editorSnapshot);
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
      setSavedEditorSnapshot(editorSnapshot);
      sessionStorage.removeItem("__new_product_images");
      sessionStorage.removeItem("__new_product_desc_images");
      if (editId) { sessionStorage.removeItem(`__edit_product_images_${editId}`); sessionStorage.removeItem(`__edit_product_desc_images_${editId}`); }
      initializedEditIdRef.current = null;
      setMsg({ type: "ok", text: json.active
        ? "Produit enregistré et visible sur le site ✓"
        : "Brouillon enregistré — produit masqué sur le site." });
      load();
      setTimeout(() => router.replace("/admin/products"), 1000);
    }
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Impossible d’enregistrer. Vos modifications sont conservées." });
    } finally { setSaving(false); }
  }

  async function handleDuplicate(id: string) {
    if (duplicating) return;
    setDuplicating(id);
    try {
      const response = await fetch(`/api/products/${id}/duplicate`,{method:"POST"});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible de dupliquer.");
      if (result.pending) setMsg({type:"ok",text:"Copie soumise pour approbation."});
      else { setMsg({type:"ok",text:"Brouillon cr??. V?rifiez le stock avant publication."}); router.push(`/admin/products?id=${result.id}`); void load(); }
    } catch(error) { setMsg({type:"err",text:error instanceof Error ? error.message : "Erreur r?seau"}); }
    finally { setDuplicating(null); }
  }

  async function handleDelete(id: string) {
    if (deleting || !await confirmAction(`Supprimer définitivement « ${products.find(product => product.id === id)?.name ?? id} » ? Cette action est irréversible.`)) return;
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
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Suppression impossible.'); }
      setBulkSelected(current => { const next = new Set(current); next.delete(id); return next; });
      await load();
    } catch (error) { setMsg({ type: 'err', text: error instanceof Error ? error.message : 'Erreur réseau.' }); }
    finally { setDeleting(null); }
  }

  async function toggleActive(p: ExtendedProduct) {
    try {
    const response = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Modification impossible.'); }
    await load();
    } catch (error) { setMsg({ type: 'err', text: error instanceof Error ? error.message : 'Erreur réseau.' }); }
  }

  const toggleColor = async (label: string) => {
    if (selectedColors.includes(label) && !await confirmAction(`Retirer la couleur « ${label} » et ses variantes du produit ?`)) return;
    setSelectedColors((prev) => prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]);
    setColorStocks((prev) => ({ ...prev, [label]: prev[label] ?? 0 }));
    setColorPrices((prev) => ({ ...prev, [label]: prev[label] ?? { price: Number(form.price) || 0, ...(Number(form.original_price) > Number(form.price) ? { originalPrice: Number(form.original_price) } : {}) } }));
    setColorImagesByColor((prev) => ({ ...prev, [label]: prev[label] ?? [] }));
  };

  const toggleColorImage = (color: string, image: string) => {
    setColorImagesByColor((current) => {
      const row = current[color] ?? [];
      return {
        ...current,
        [color]: row.includes(image) ? row.filter((item) => item !== image) : [...row, image],
      };
    });
  };

  const removeProductImage = (image: string) => {
    setImages((current) => current.filter((item) => item !== image));
    setColorImagesByColor((current) => Object.fromEntries(
      Object.entries(current).map(([color, row]) => [color, row.filter((item) => item !== image)]),
    ));
  };

  const toggleSize = async (s: string) => {
    if (selectedSizes.includes(s) && !await confirmAction(`Retirer la taille « ${s} » et ses variantes du produit ?`)) return;
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const presetSizes =
    sizeGuideType === "shoes" ? SHOE_SIZES
    : sizeGuideType === "clothing" ? CLOTHING_SIZES
    : sizeGuideType === "custom" ? customSizes
    : form.category === "chaussures" ? SHOE_SIZES
    : CLOTHING_SIZES;
  const sizeSet = [...new Set([...presetSizes, ...customSizes, ...selectedSizes])];
  const hasColorSizeStock = selectedColors.some((color) => selectedSizes.some((size) => Object.prototype.hasOwnProperty.call(colorSizeStocks[color] ?? {}, size)));

  function enableColorSizeStock() {
    setColorSizeStocks(current => Object.fromEntries(selectedColors.map((color) => [color, Object.fromEntries(selectedSizes.map((size) => [size, current[color]?.[size] ?? 0]))])));
  }

  function addCustomSize() {
    const val = customSizeInput.trim();
    if (!val || val.length > 40 || /[\u0000-\u001f]/.test(val)) { setMsg({ type: "err", text: "Indiquez une taille de 1 à 40 caractères." }); return; }
    if (selectedSizes.includes(val)) { setCustomSizeInput(""); return; }
    setCustomSizes((prev) => [...prev, val]);
    setSelectedSizes((prev) => [...prev, val]);
    setCustomSizeInput("");
  }

  async function removeCustomSize(s: string) {
    if (!await confirmAction(`Supprimer la taille « ${s} » et son stock du produit ?`)) return;
    setCustomSizes((prev) => prev.filter((x) => x !== s));
    setSelectedSizes((prev) => prev.filter((x) => x !== s));
    setSizeStocks((prev) => { const n = { ...prev }; delete n[s]; return n; });
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || `${p.name} ${p.slug} ${p.brand ?? ""} ${p.id}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" && p.active) || (statusFilter === "inactive" && !p.active) || (statusFilter === "out" && p.stock === 0) || (statusFilter === "low" && p.stock > 0 && p.stock <= lowStockThreshold);
    return matchSearch && matchCat && matchStatus && (!brandFilter || p.brand === brandFilter);
  });
  filtered.sort((a, b) => sortBy === "price-up" ? a.price - b.price : sortBy === "price-down" ? b.price - a.price : sortBy === "stock" ? a.stock - b.stock : sortBy === "name" ? a.name.localeCompare(b.name, "fr") : 0);
  const pagination = useAdminPagination(filtered, JSON.stringify([search, filterCat, statusFilter, brandFilter, sortBy]));
  const resetFilters = () => { setSearch(""); setStatusFilter("all"); setBrandFilter(""); setSortBy("default"); router.replace("/admin/products"); };
  const activeProducts = products.filter((product) => product.active).length;
  const outOfStockProducts = products.filter((product) => product.stock === 0).length;
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= lowStockThreshold).length;
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
    if (editorDirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter sans enregistrer ?")) return;
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
  const savedProductSlug = products.find((product) => product.id === editId)?.slug;
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
              <img src={images[0]} alt="Aperçu du produit" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
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
          {savedProductSlug ? (
            <Link href={`/produit/${encodeURIComponent(savedProductSlug)}`} target="_blank" rel="noopener noreferrer"
              aria-label="Voir la fiche produit (nouvel onglet)"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[10px] font-black text-black shadow-[0_8px_22px_rgba(255,255,255,.08)] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              Voir la fiche
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          ) : (
            <span className="max-w-36 text-right text-[10px] leading-4 text-white/60">Enregistrez le produit pour ouvrir sa fiche.</span>
          )}
        </div>
      </div>
    </div>
  );

  if (showForm) return (
    <div className="admin-product-editor mx-auto w-full max-w-[1440px] pb-28 lg:pb-12">
      {confirmationDialog}
      <div className="admin-editor-heading sticky top-0 z-30 -mx-4 mb-5 border-b border-neutral-200/80 bg-[#f6f6f4]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mb-7 lg:rounded-[26px] lg:border lg:bg-white lg:p-5 lg:shadow-[0_12px_35px_rgba(0,0,0,.055)]">
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
        <div className="admin-editor-progress mt-4 lg:hidden">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Votre fiche produit</span><span className="font-semibold text-emerald-700">{editorCompletion}% complété</span>
          </div>
          <div role="progressbar" aria-label="Fiche produit complétée" aria-valuenow={editorCompletion} aria-valuemin={0} aria-valuemax={100} className="h-1 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: editorCompletion + "%" }} />
          </div>
          <nav aria-label="Sections de la fiche produit" className="mt-4 grid grid-cols-3 gap-2">
            {[['product-information', 'Informations'], ['product-images', 'Photos'], ['product-variants', 'Tailles & stock']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => jumpToSection(id)} className="rounded-xl border border-neutral-200 bg-white px-2 text-[11px] font-semibold text-neutral-600">{label}</button>
            ))}
          </nav>
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
        <div className="mb-5"><MobileSection title="Importer un produit depuis un lien">
        <div className="admin-editor-import relative mb-5 overflow-hidden rounded-[24px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4 shadow-[0_8px_30px_rgba(109,40,217,.06)] sm:p-5">
            <div aria-hidden="true" className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <p className="text-sm font-black text-violet-900">Import IA depuis AliExpress / Temu / Amazon</p>
                <p className="text-[11px] text-violet-600">Collez un lien produit — l&apos;IA génère automatiquement nom, description, catégorie, tags <strong>et importe les images</strong></p>
              </div>
            </div>
            <div className="admin-mobile-toolbar relative flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={aiUrl}
                onChange={e => setAiUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAiImport())}
                placeholder="https://www.aliexpress.com/item/... ou https://www.temu.com/..."
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" inputMode="url"
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
        </MobileSection></div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-6">
          {/* ── LEFT ── */}
          <div className="space-y-4">
            {/* General info */}
            <MobileSection id="product-information" title="Informations générales" defaultOpen><div className="space-y-5 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
            </div></MobileSection>

            {/* Product Details */}
            <MobileSection title="Détails du produit"><div id="product-size-inventory" className="scroll-mt-40 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                        aria-label={`Nom du détail ${i + 1}`}
                        className="min-h-10 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold outline-none transition focus:border-black sm:w-full"
                      />
                      <span className="hidden shrink-0 text-xs text-neutral-300 sm:block">:</span>
                      <input
                        type="text"
                        value={detail.value}
                        onChange={(e) => setProductDetails((p) => p.map((d, j) => j === i ? { ...d, value: e.target.value } : d))}
                        placeholder="Ex: 100% coton biologique"
                        aria-label={`Valeur du détail ${i + 1}`}
                        className="col-start-1 row-start-2 min-h-10 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-black sm:col-start-3 sm:row-start-1"
                      />
                      <button type="button"
                        onClick={() => setProductDetails((p) => p.filter((_, j) => j !== i))}
                        aria-label={`Supprimer le détail ${i + 1}`}
                        className="col-start-2 row-start-1 row-span-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 sm:col-start-4 sm:row-span-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div></MobileSection>

            {/* Category */}
            <MobileSection title="Catégorie"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
            </div></MobileSection>

            {/* Pricing */}
            <MobileSection title="Prix et inventaire"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-[10px] font-black text-[#3ecf4c]">03</span>
                <div><h2 className="text-xs font-black uppercase tracking-[.16em] text-neutral-800">Tarification &amp; Stock</h2><p className="mt-0.5 text-[10px] text-neutral-400">Prix de vente, remise et inventaire disponible</p></div>
              </div>
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Prix *</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <input type="number" value={form.price} required min="0" step="0.01" onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" inputMode="decimal" />
                    <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Ancien prix</label>
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <input type="number" value={form.original_price} min="0" step="0.01" onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                      className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" inputMode="decimal" />
                    <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
                  </div>
                  {form.original_price && form.price && parseFloat(form.original_price) > parseFloat(form.price) && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">-{Math.round((1 - parseFloat(form.price) / parseFloat(form.original_price)) * 100)}% off</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Stock</label>
                  <div className="admin-mobile-actions flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                    <button type="button" onClick={() => setForm({ ...form, stock: String(Math.max(0, parseInt(form.stock || "0") - 1)) })}
                      className="px-3 py-3 text-neutral-400 hover:text-black transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <input type="number" value={form.stock} min="0" onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="flex-1 py-3 text-sm text-center focus:outline-none bg-transparent w-0" inputMode="decimal" />
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
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="decimal" />
                </div>
              </div>
            </div></MobileSection>

            {/* Colors */}
            <MobileSection title="Couleurs et prix"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
              {selectedColors.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
                  <div className="flex flex-col gap-2 border-b border-neutral-200 bg-neutral-950 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[.16em]">Prix et stock par couleur</p>
                      <p className="mt-0.5 text-[10px] text-white/55">Chaque variante sera publiée sur le site et dans l’application.</p>
                    </div>
                    <span className="w-fit rounded-full bg-[#3ecf4c] px-2.5 py-1 text-[9px] font-black text-black">
                      {Object.values(colorStocks).reduce((total, quantity) => total + Math.max(0, Number(quantity) || 0), 0)} UNITÉS
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100 bg-white">
                    {selectedColors.map((color, index) => {
                      const swatch = AVAILABLE_COLORS.find((item) => item.label === color);
                      const pricing = colorPrices[color] ?? { price: Number(form.price) || 0 };
                      return (
                        <div key={color} className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white">
                                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: swatch?.hex ?? "#ddd" }} />
                              </span>
                              <div><p className="text-sm font-black text-neutral-900">{color}</p><p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Variante {String(index + 1).padStart(2, "0")}</p></div>
                            </div>
                            <button type="button" onClick={() => toggleColor(color)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-500 transition hover:bg-red-50">Retirer</button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Prix de vente
                              <span className="mt-1 flex h-11 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 focus-within:border-black focus-within:bg-white"><input required type="number" min="0" step="0.01" value={pricing.price} onChange={(event) => setColorPrices((current) => ({ ...current, [color]: { ...pricing, price: Number(event.target.value) } }))} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" inputMode="decimal" /><span className="text-[10px] text-neutral-400">MAD</span></span>
                            </label>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Ancien prix
                              <span className="mt-1 flex h-11 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 focus-within:border-black focus-within:bg-white"><input type="number" min="0" step="0.01" value={pricing.originalPrice ?? ""} onChange={(event) => setColorPrices((current) => ({ ...current, [color]: { ...pricing, originalPrice: event.target.value ? Number(event.target.value) : undefined } }))} className="min-w-0 flex-1 bg-transparent text-sm outline-none" inputMode="decimal" /><span className="text-[10px] text-neutral-400">MAD</span></span>
                            </label>
                            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Stock disponible
                              <span className="mt-1.5 flex min-h-14 items-center overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
                                <input required type="number" min="0" step="1" aria-label={`Stock disponible, ${color}`} value={colorStocks[color] ?? 0} onChange={(event) => setColorStocks((current) => ({ ...current, [color]: Math.max(0, Math.trunc(Number(event.target.value) || 0)) }))} className="h-14 w-full min-w-0 flex-1 bg-transparent px-4 text-left text-base font-semibold tabular-nums tracking-normal text-neutral-900 outline-none" inputMode="numeric" />
                                <span className="shrink-0 border-l border-neutral-200 px-3 text-xs font-medium normal-case tracking-normal text-neutral-500">unités</span>
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div></MobileSection>

            {/* Sizes */}
            <MobileSection id="product-variants" title="Tailles et stock par variante"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Tailles disponibles
                  {selectedSizes.length > 0 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">{selectedSizes.length}</span>}
                </h2>
                <Link href="/admin/size-guide" target="_blank"
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-black transition-colors underline underline-offset-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Guide général
                </Link>
              </div>
              <ProductSizeGuideEditor key={editId ?? "new"} value={productSizeGuide} onChange={setProductSizeGuide} sizes={selectedSizes} clothing={sizeGuideType === "clothing"} />
                  <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
                    <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" checked={form.preorder_enabled} onChange={e => setForm({...form, preorder_enabled:e.target.checked})}/>{preorderCopy.fr.toggle}</label>
                    {form.preorder_enabled && <><label className="block text-xs">{preorderCopy.fr.estimated}<input type="date" className="block border rounded p-2 mt-1" value={form.preorder_estimated_at} onChange={e=>setForm({...form,preorder_estimated_at:e.target.value})}/></label><label className="block text-xs">{preorderCopy.fr.message}<textarea className="block w-full border rounded p-2 mt-1" maxLength={500} value={form.preorder_message} onChange={e=>setForm({...form,preorder_message:e.target.value})}/></label><p className="text-xs text-neutral-500">{preorderCopy.fr.quantity}</p></>}
                  </div>
              {/* Size guide type selector */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Guide de tailles :</span>
                {(["none", "clothing", "shoes", "custom"] as const).map((opt) => {
                  const labels = { none: "Aucun", clothing: "Vêtements", shoes: "Chaussures", custom: "Personnalisé" };
                  return (
                    <button key={opt} type="button" onClick={() => {
                      // A product guide is tied to its guide type. Clear it when
                      // switching between shoes, clothing and custom sizes so
                      // an old four-column table can never be saved against the
                      // wrong product category.
                      setSizeGuideType(opt);
                      setProductSizeGuide(null);
                      setSelectedSizes([]);
                      setSizeStocks({});
                      setColorSizeStocks({});
                      if (opt !== "custom") setCustomSizes([]);
                    }}
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
                  {(
                    <div className="admin-mobile-toolbar flex gap-2 mb-4">
                      <input
                        type="text"
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                        placeholder="Ex : 44.5, XXXL, 100ml, Unique…"
                        maxLength={40}
                        aria-label="Ajouter une taille personnalisée"
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
                    <div className="admin-mobile-actions flex items-center gap-2 mb-3">
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
                  {selectedSizes.length > 0 && !hasColorSizeStock && (
                    <div className="mt-5 border-t border-neutral-100 pt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Stock par taille</p>
                          <p className="mt-0.5 text-[10px] text-neutral-400">Saisissez 0 pour rendre une pointure ou taille indisponible.</p>
                        </div>
                        <span className="rounded-full bg-[#3ecf4c]/15 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                          {selectedSizes.some((size) => Object.prototype.hasOwnProperty.call(sizeStocks, size))
                            ? `${sizeStockTotal(Object.fromEntries(selectedSizes.map((size) => [size, sizeStocks[size] ?? 0])))} UNITÉS`
                            : "À RÉPARTIR"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2">
                        {selectedSizes.map((s) => (
                          <div key={s} className="min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                            <label htmlFor={`size-stock-${s}`} className="mb-2 block text-xs font-black text-neutral-700">Taille {s}</label>
                            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1">
                            <button type="button" onClick={() => setSizeStocks((p) => ({ ...p, [s]: Math.max(0, (p[s] ?? 0) - 1) }))}
                              aria-label={`Retirer une unité, taille ${s}`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-black transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                            <input id={`size-stock-${s}`} type="number" min="0" step="1" value={sizeStocks[s] ?? ""}
                              onChange={(e) => setSizeStocks((p) => ({ ...p, [s]: Math.max(0, parseInt(e.target.value) || 0) }))}
                              placeholder="0"
                              className="admin-stock-number h-11 w-full min-w-0 rounded-lg border border-neutral-200 bg-white text-center text-base font-bold tabular-nums text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600" inputMode="numeric" />
                            <button type="button" onClick={() => setSizeStocks((p) => ({ ...p, [s]: (p[s] ?? 0) + 1 }))}
                              aria-label={`Ajouter une unité, taille ${s}`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-black transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedColors.length > 0 && selectedSizes.length > 0 && (
                    <div className="mt-5 border-t border-neutral-100 pt-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-neutral-700">Stock par couleur et taille</p>
                          <p className="mt-1 text-[10px] leading-4 text-neutral-400">Définissez exactement les combinaisons vendables, par exemple Jaune / 45 = 1.</p>
                        </div>
                        {hasColorSizeStock && <span className="shrink-0 rounded-full bg-[#3ecf4c]/15 px-2.5 py-1 text-[10px] font-black text-emerald-700">{colorSizeStockTotal(Object.fromEntries(selectedColors.map((color) => [color, Object.fromEntries(selectedSizes.map((size) => [size, colorSizeStocks[color]?.[size] ?? 0]))])))} UNITÉS</span>}
                      </div>
                      {!hasColorSizeStock ? (
                        <button type="button" onClick={enableColorSizeStock} className="min-h-11 w-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-xs font-black text-neutral-700 transition hover:border-black hover:bg-white">
                          Activer le stock couleur × taille
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {selectedColors.map((color) => (
                            <div key={color} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
                              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-black text-neutral-800">{color}</span><span className="text-[10px] font-bold text-neutral-400">{sizeStockTotal(Object.fromEntries(selectedSizes.map((size) => [size, colorSizeStocks[color]?.[size] ?? 0])))} unités</span></div>
                              <div className="admin-mobile-fields grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {selectedSizes.map((size) => (
                                  <label key={`${color}-${size}`} className="flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
                                    <span className="w-8 shrink-0 text-[11px] font-black text-neutral-600">{size}</span>
                                    <input type="number" min="0" step="1" value={colorSizeStocks[color]?.[size] ?? 0} onChange={(event) => setColorSizeStocks((current) => ({ ...current, [color]: { ...(current[color] ?? {}), [size]: Math.max(0, Math.trunc(Number(event.target.value) || 0)) } }))} aria-label={`Stock ${color}, taille ${size}`} className="min-w-0 flex-1 bg-transparent text-center text-xs font-black outline-none" inputMode="decimal" />
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={async () => { if (await confirmAction('Désactiver le suivi du stock par combinaison couleur / taille ?')) setColorSizeStocks({}); }} className="text-[10px] font-bold text-red-500 underline underline-offset-2">Désactiver la matrice</button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div></MobileSection>

          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">
            <div className="hidden lg:block">{editorPreview}</div>
            {/* Images */}
            <MobileSection id="product-images" title="Images du produit"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-black bg-black text-white px-1.5 py-0.5 rounded-full">MAIN</span>}
                      <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {i > 0 && (
                          <button type="button" onClick={() => setImages((prev) => { const a = [...prev]; [a[0], a[i]] = [a[i], a[0]]; return a; })}
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-black">★</button>
                        )}
                        <button type="button" onClick={() => removeProductImage(url)} aria-label="Supprimer cette image"
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {images.length > 0 && selectedColors.length > 0 && (
                <div className="mt-5 border-t border-neutral-100 pt-5">
                  <div className="mb-3">
                    <p className="text-[11px] font-black uppercase tracking-[.14em] text-neutral-800">Images par couleur</p>
                    <p className="mt-1 text-[10px] leading-4 text-neutral-400">Choisissez une ou plusieurs photos. La n°1 devient l’image principale de la couleur.</p>
                  </div>
                  <div className="space-y-4">
                    {selectedColors.map((color) => {
                      const assigned = colorImagesByColor[color] ?? [];
                      const swatch = AVAILABLE_COLORS.find((item) => item.label === color);
                      return (
                        <fieldset key={color} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
                          <legend className="px-1 text-[11px] font-black text-neutral-800">
                            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full border border-black/10 align-middle" style={{ backgroundColor: swatch?.hex ?? "#ddd" }} />
                            {color} · {assigned.length} photo{assigned.length !== 1 ? "s" : ""}
                          </legend>
                          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                            {images.map((url, index) => {
                              const position = assigned.indexOf(url);
                              const selected = position >= 0;
                              return (
                                <button
                                  key={`${color}-${url}`}
                                  type="button"
                                  onClick={() => toggleColorImage(color, url)}
                                  aria-label={`${selected ? "Retirer" : "Associer"} l’image ${index + 1} ${selected ? "de" : "à"} la couleur ${color}`}
                                  aria-pressed={selected}
                                  className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${selected ? "border-black shadow-sm" : "border-transparent opacity-55 hover:opacity-100"}`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                                  {selected && (
                                    <span className="absolute left-1 top-1 rounded-full bg-black px-1.5 py-0.5 text-[8px] font-black text-white">
                                      {position === 0 ? "PRINCIPALE" : position + 1}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {assigned.length === 0 && <p className="mt-2 text-[10px] font-semibold text-amber-700">Aucune image assignée : la galerie générale sera utilisée.</p>}
                        </fieldset>
                      );
                    })}
                  </div>
                </div>
              )}
            </div></MobileSection>

            {/* Video URL */}
            <MobileSection title="Vidéo"><div className="space-y-3 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="url"
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
            </div></MobileSection>

            {/* Description Images */}
            <MobileSection title="Images de description"><div className="rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
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
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
            </div></MobileSection>

            {/* Status & Options */}
            <MobileSection title="Visibilité"><div className="space-y-4 rounded-[24px] border border-neutral-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,.035)] sm:p-6">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Statut &amp; Options</h2>
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div>
                  <p className="text-sm font-semibold">Actif</p>
                  <p className="text-[11px] text-neutral-400">{form.active ? "Visible sur le site après enregistrement" : "Brouillon : masqué sur le site"}</p>
                </div>
                <AdminToggle checked={form.active} label="Actif" tone="black" onClick={() => setForm({ ...form, active: !form.active })} />
              </label>
              <div className="h-px bg-neutral-100" />
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5"><span className="text-yellow-400">★</span> Mis en avant</p>
                  <p className="text-[11px] text-neutral-400">Affiché dans les bestsellers</p>
                </div>
                <AdminToggle checked={form.featured} label="Mis en avant" tone="yellow" onClick={() => setForm({ ...form, featured: !form.featured })} />
              </label>
            </div></MobileSection>

            {msg && (
              <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {msg.text}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 lg:hidden"><MobileSection title="Aperçu de la fiche">{editorPreview}</MobileSection></div>
        <div className="admin-editor-actions fixed inset-x-0 bottom-[var(--admin-nav-height)] z-20 border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-12px_35px_rgba(0,0,0,.1)] backdrop-blur-xl lg:hidden">
          <div className="admin-mobile-actions mx-auto flex max-w-lg gap-2">
            <button type="button" onClick={closeEditor} className="min-h-12 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-600">Annuler</button>
            <button type="submit" disabled={saving} className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#173c2c] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20533d] disabled:opacity-50">
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
    <div className="mx-auto w-full max-w-7xl pb-28 md:pb-12">
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-52 w-52 rounded-full bg-[#3ecf4c]/10 blur-3xl" />
        <div className="admin-mobile-heading relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-3 lg:grid-cols-4">
        {[
          { label: "Produits actifs", value: activeProducts, detail: `${products.length - activeProducts} masqué${products.length - activeProducts !== 1 ? "s" : ""}`, tone: "emerald", icon: <path d="m5 12 4 4L19 6"/> },
          { label: "Stock faible", value: lowStockProducts, detail: `${lowStockThreshold} unités ou moins`, tone: "amber", icon: <path d="M12 9v4M12 17h.01"/> },
          { label: "Ruptures", value: outOfStockProducts, detail: "À réapprovisionner", tone: "red", icon: <path d="M18 6 6 18M6 6l12 12"/> },
          { label: "Valeur du stock", value: `${inventoryValue.toLocaleString("fr-MA")} MAD`, detail: "Au prix de vente", tone: "neutral", icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6"/> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[18px] border border-neutral-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,.025)] sm:rounded-2xl sm:p-5">
            <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3">
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-neutral-400 sm:text-[10px] sm:tracking-[.14em]">{stat.label}</p>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${stat.tone === "emerald" ? "bg-emerald-50 text-emerald-600" : stat.tone === "amber" ? "bg-amber-50 text-amber-600" : stat.tone === "red" ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600"}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">{stat.icon}</svg></span>
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
                      ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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

      <div className="mb-4 rounded-[20px] border border-neutral-200 bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,.035)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="search" aria-label="Rechercher un produit" placeholder="Nom, marque, référence…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/[.04]" />
        </div>
        <FilterPanel onReset={resetFilters}><div className="flex flex-wrap gap-2">
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => router.replace(c === "all" ? "/admin/products" : `/admin/products?cat=${c}`)}
            className={`flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${filterCat === c ? "bg-black text-white shadow-md shadow-black/10" : "border border-neutral-200 bg-white text-neutral-600 hover:border-black"}`}>
            <span>{c === "all" ? "Tous" : c.charAt(0).toUpperCase() + c.slice(1)}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] ${filterCat === c ? "bg-white/15 text-white/80" : "bg-neutral-100 text-neutral-400"}`}>{c === "all" ? products.length : products.filter((product) => product.category === c).length}</span>
          </button>
        ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <label className="text-xs font-semibold">Statut et stock<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="all">Tous</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="low">Stock faible</option><option value="out">Rupture</option></select></label>
  <label className="text-xs font-semibold">Marque<select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Toutes</option>{Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort().map(brand => <option key={brand} value={brand}>{brand}</option>)}</select></label>
  <label className="text-xs font-semibold">Trier par<select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="default">Ordre du catalogue</option><option value="name">Nom</option><option value="price-up">Prix croissant</option><option value="price-down">Prix décroissant</option><option value="stock">Stock croissant</option></select></label>
  </div></FilterPanel>{/* Scroll arrows for the table below */}
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
        {(search || filterCat !== "all" || statusFilter !== "all" || brandFilter || sortBy !== "default") && <button type="button" onClick={resetFilters} className="font-bold text-neutral-600 hover:text-black">Réinitialiser les filtres</button>}
      </div>
      </div>

      {confirmationDialog}
      {!isStaff && <ProductBulkActions products={filtered} selected={bulkSelected} onSelection={setBulkSelected} onComplete={load} />}
      {loading ? (
        <AdminLoading />
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
                {!isStaff && <th className="px-2 py-3"><span className="sr-only">Sélection</span></th>}
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
              {pagination.items.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/70 transition-colors">
                  {!isStaff && <td className="px-2"><label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" aria-label={`Sélectionner ${p.name}`} checked={bulkSelected.has(p.id)} onChange={() => selectProduct(p.id)} /></label></td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100">
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                    <span className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : p.stock <= lowStockThreshold ? "text-yellow-600" : "text-emerald-600"}`}>
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
                    <div className="admin-mobile-actions flex items-center justify-end gap-1">
                      <Link href={`/produit/${p.slug}`} target="_blank"
                        aria-label={`Voir ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-white hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button onClick={() => router.push(`/admin/products?id=${p.id}`)}
                        aria-label={`Modifier ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-white hover:text-black">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <DuplicateButton pending={duplicating === p.id} onClick={() => handleDuplicate(p.id)} /><button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
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
        <div className="space-y-2.5 md:hidden">
          {pagination.items.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,.035)]">
              {!isStaff && <label className="flex min-h-11 items-center gap-2 px-4 text-xs"><input type="checkbox" checked={bulkSelected.has(p.id)} onChange={() => selectProduct(p.id)} />Sélectionner {p.name}{p.tags?.includes('__archived') ? ' · Archivé' : ''}</label>}
              <div className="flex gap-3 p-3.5">
                <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[14px] border border-neutral-100 bg-neutral-100">
                  {p.images?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    : <div className="flex h-full w-full items-center justify-center text-neutral-300"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[13px] font-black leading-[1.25rem] text-neutral-950">{p.name} {p.featured && <span className="text-amber-400">★</span>}</p>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wide ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{p.active ? "Actif" : "Masqué"}</span>
                  </div>
                  <p className="truncate text-[9px] text-neutral-400">{p.brand ? `${p.brand} · ` : ""}{p.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(p.colors?.length ?? 0) > 0 && <span className="rounded-md bg-neutral-100 px-1.5 py-1 text-[8px] font-bold text-neutral-500">{p.colors!.length} couleur{p.colors!.length > 1 ? "s" : ""}</span>}
                    {(p.sizes?.length ?? 0) > 0 && <span className="rounded-md bg-neutral-100 px-1.5 py-1 text-[8px] font-bold text-neutral-500">{p.sizes!.length} taille{p.sizes!.length > 1 ? "s" : ""}</span>}
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div><p className="text-base font-black">{p.price} MAD</p>{p.original_price && <p className="text-[10px] text-neutral-400 line-through">{p.original_price} MAD</p>}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${p.stock === 0 ? "bg-red-50 text-red-600" : p.stock <= lowStockThreshold ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{p.stock === 0 ? "Épuisé" : `${p.stock} en stock`}</span>
                  </div>
                </div>
              </div>
              <div className="admin-mobile-actions flex flex-wrap items-center gap-2 border-t border-neutral-100 bg-neutral-50/70 p-2.5">
                <span className="mr-auto rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-neutral-500 ring-1 ring-neutral-200">{p.category}</span>
                <Link href={`/produit/${p.slug}`} target="_blank" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-sm ring-1 ring-neutral-200" aria-label={`Voir ${p.name}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg></Link>
                <button onClick={() => router.push(`/admin/products?id=${p.id}`)} className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-[10px] font-black text-white shadow-sm"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>Modifier</button>
                <ActionMenu label={"Autres actions pour " + p.name}><DuplicateButton pending={duplicating === p.id} onClick={() => handleDuplicate(p.id)} /><button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 disabled:opacity-50" aria-label={`Supprimer ${p.name}`}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/></svg></button></ActionMenu>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
      {!loading && <Pagination {...pagination} />}
    </div>
  );
}
