"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Order } from "@/lib/supabase";

const STATUS_OPTIONS = [
  { value: "pending",   label: "En attente", color: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-400" },
  { value: "confirmed", label: "Confirmée",  color: "bg-blue-100 text-blue-700",      dot: "bg-blue-400" },
  { value: "shipped",   label: "Expédiée",   color: "bg-purple-100 text-purple-700",  dot: "bg-purple-400" },
  { value: "delivered", label: "Livrée",     color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-400" },
  { value: "cancelled", label: "Annulée",    color: "bg-red-100 text-red-700",        dot: "bg-red-400" },
];
const statusColor = (s: string) => STATUS_OPTIONS.find((x) => x.value === s)?.color ?? "bg-neutral-100 text-neutral-500";
const statusLabel = (s: string) => STATUS_OPTIONS.find((x) => x.value === s)?.label ?? s;

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.527 5.862L.057 23.885l6.162-1.616A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.359-.213-3.72.976.993-3.628-.234-.373A9.818 9.818 0 1112 21.818z"/>
  </svg>
);

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const detailId = searchParams.get("id");
  const requestedStatus = searchParams.get("status");
  const initialStatus = STATUS_OPTIONS.some((option) => option.value === requestedStatus) ? requestedStatus! : "all";

  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [filterSource, setFilterSource] = useState<"all" | "website" | "mobile_app">("all");
  const [search, setSearch]       = useState("");
  const [trackingInput, setTrackingInput]   = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [notesInput, setNotesInput]         = useState("");
  const [notesSaving, setNotesSaving]       = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]   = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"confirmed" | "shipped" | "delivered" | "cancelled" | null>(null);
  const [reviewModal, setReviewModal] = useState<Order | null>(null);
  const [reviewSending, setReviewSending] = useState<"email" | "whatsapp" | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 6000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch("/api/orders", {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLoadError(data?.error ?? `Impossible de charger les commandes (${res.status}).`);
        setOrders([]);
        return;
      }
      if (!Array.isArray(data)) {
        setLoadError("La réponse des commandes est invalide.");
        setOrders([]);
        return;
      }
      setOrders(data);
    } catch (error) {
      setOrders([]);
      setLoadError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Le chargement des commandes a expiré. Réessayez."
          : "Impossible de joindre le serveur des commandes."
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const nextStatus = STATUS_OPTIONS.some((option) => option.value === requestedStatus) ? requestedStatus! : "all";
    setFilterStatus(nextStatus);
  }, [requestedStatus]);

  const detail = detailId ? orders.find((o) => o.id === detailId) ?? null : null;

  useEffect(() => {
    if (detail) {
      setTrackingInput(detail.tracking_number ?? "");
      setNotesInput(detail.notes ?? "");
      setPendingAction(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { const j = await res.json(); showToast("Erreur : " + (j.error ?? "inconnue"), false); return; }
    await load();
    showToast("Statut mis à jour ✓");
  }

  async function saveTracking(id: string) {
    setTrackingSaving(true);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number: trackingInput.trim() || null }),
    });
    await load();
    setTrackingSaving(false);
    showToast("Numéro de suivi enregistré ✓");
  }

  async function saveNotes(id: string) {
    setNotesSaving(true);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesInput.trim() || null }),
    });
    await load();
    setNotesSaving(false);
    showToast("Note enregistrée ✓");
  }

  function buildWaUrl(order: Order, type: string) {
    const phone = (order.customer?.phone ?? "").replace(/\s+/g, "");
    const wa = phone.startsWith("0") ? "212" + phone.slice(1) : phone;
    const name = order.customer?.name ?? "Client";
    const num  = order.order_number;
    const tracking = order.tracking_number ?? "";
    const msgs: Record<string, string> = {
      confirmed:   `Bonjour ${name},\n\n✅ *Commande confirmée*\nVotre commande *#${num}* a bien été enregistrée. Notre équipe commence sa préparation avec soin.\n\nVous recevrez un nouveau message dès son expédition.\n\nSuivre la commande :\nhttps://lecomax.com/suivre-commande\n\nMerci pour votre confiance,\nL'équipe *L'ecomax*`,
      shipped:     `Bonjour ${name},\n\n🚚 *Votre colis est en route*\nLa commande *#${num}* vient de quitter nos locaux.${tracking ? `\n\nNuméro de suivi : *${tracking}*` : ""}\n\nLivraison estimée : 2 à 5 jours ouvrables.\nSuivre la commande :\nhttps://lecomax.com/suivre-commande\n\nL'équipe *L'ecomax*`,
      delivered:   `Bonjour ${name},\n\n✅ *Commande livrée*\nLa commande *#${num}* est indiquée comme livrée. Nous espérons que tout est conforme à vos attentes.\n\nVotre facture :\nhttps://lecomax.com/facture/${order.id}\n\nVous recevrez également un lien sécurisé pour partager votre avis sur les produits reçus.\n\nMerci pour votre confiance,\nL'équipe *L'ecomax*`,
      cancelled:   `Bonjour ${name},\n\nVotre commande *#${num}* a été annulée.\n\nSi cette annulation vous surprend ou si vous souhaitez être accompagné(e), répondez simplement à ce message.\n\nL'équipe *L'ecomax*`,
      productReview: `Bonjour ${name.split(" ")[0] || "Client"},\n\nVotre commande *#${num}* a bien été livrée. Nous espérons que vos articles vous plaisent.\n\n*Partagez votre avis sur les produits achetés :*\n\n${(order.items ?? []).slice(0, 5).map((item, index) => `${index + 1}. ${item.name}\nhttps://lecomax.com/produit/${encodeURIComponent(item.slug || "")}?review=1&email=${encodeURIComponent(order.customer?.email || "")}#avis`).join("\n\n") || "https://lecomax.com/boutique"}\n\nVotre retour aide les autres clients à choisir et nous permet de mieux vous servir. Merci pour votre confiance.\n\nL'équipe *L'ecomax*`,
      trustpilot: `Bonjour ${name.split(" ")[0] || "Client"},\n\nNous espérons que vous êtes pleinement satisfait(e) de votre commande *#${num}*.\n\n*Votre expérience compte beaucoup pour nous.* En partageant un avis sincère sur Trustpilot, vous aidez d'autres clients à faire leur choix et notre équipe à continuer d'améliorer la qualité de ses services.\n\n⭐ *Partager mon expérience*\nhttps://www.trustpilot.com/evaluate/lecomax.com\n\nCela ne prend que quelques instants. Chaque retour est lu avec attention par notre équipe.\n\nMerci d'avoir choisi L'ecomax et de nous accorder votre confiance.\n\nBien cordialement,\n*L'équipe Expérience Client L'ecomax*`,
    };
    return `https://wa.me/${wa}?text=${encodeURIComponent(msgs[type] ?? "")}`;
  }

  async function handleEmail(id: string, type: "confirmed" | "shipped" | "delivered" | "cancelled") {
    setSending("email");
    const updateResponse = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: type }),
    });
    if (!updateResponse.ok) {
      const failure = await updateResponse.json().catch(() => ({}));
      setSending(null);
      showToast(`Mise à jour impossible : ${failure.error ?? "erreur inconnue"}`, false);
      return;
    }
    if (type === "delivered") {
      await load();
      setSending(null);
      setPendingAction(null);
      showToast("Livraison confirmée · Avis produit envoyé · rappel produits J+2 programmé ✓");
      return;
    }
    const res = await fetch(`/api/orders/${id}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, channel: "email" }),
    });
    const data = await res.json();
    await load();
    setSending(null);
    setPendingAction(null);
    const r = data.results?.email ?? "error";
    if (r === "sent") showToast("Statut mis à jour · Email envoyé ✓");
    else if (r === "no_email") showToast("Statut mis à jour · Aucun email client", false);
    else if (r === "not_configured") showToast("Clé Resend manquante dans .env.local", false);
    else if (r.includes("domain")) showToast("Domaine non vérifié sur Resend — vérifiez lecomax.ma", false);
    else showToast(`Email échoué : ${r.replace("error: ", "")}`, false);
  }

  async function confirmDelivery(id: string) {
    setSending("delivery");
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(`Livraison non confirmée : ${data.error ?? "erreur inconnue"}`, false);
        return;
      }

      const automation = data.reviewAutomation as {
        productReview?: "sent" | "missing_email" | "not_configured" | "failed";
        productWhatsApp?: "sent" | "missing_phone" | "not_configured" | "failed";
        followupScheduled?: boolean;
      } | null;
      if (!automation) {
        showToast("Livraison déjà confirmée. Aucun nouvel email n'a été envoyé.");
      } else if (automation.productReview === "sent" && automation.followupScheduled) {
        const wa = automation.productWhatsApp === "sent" ? " WhatsApp et email envoyés." : " Email envoyé.";
        showToast(`Livraison confirmée.${wa} Rappel produits + Trustpilot programmé à J+2.`);
      } else if (automation.productReview === "missing_email") {
        showToast("Livraison confirmée, mais aucun email client n'est disponible.", false);
      } else if (automation.productReview === "not_configured") {
        showToast("Livraison confirmée, mais Resend n'est pas configuré. Vérifiez RESEND_API_KEY.", false);
      } else {
        showToast("Livraison confirmée, mais l'email d'avis n'a pas pu être envoyé. Vérifiez Resend.", false);
      }
      setPendingAction(null);
      await load();
    } catch {
      showToast("Impossible de confirmer la livraison. Vérifiez la connexion puis réessayez.", false);
    } finally {
      setSending(null);
    }
  }

  async function handleWhatsApp(id: string, type: "confirmed" | "shipped" | "delivered" | "cancelled") {
    setSending("whatsapp");
    const order = orders.find((o) => o.id === id);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: type }),
    });
    if (order) window.open(buildWaUrl(order, type), "_blank");
    await load();
    setSending(null);
    setPendingAction(null);
    showToast(type === "delivered"
      ? "Livraison confirmée · Avis produit envoyé · rappel produits J+2 programmé ✓"
      : "Statut mis à jour · WhatsApp ouvert ✓");
  }

  async function handleTrustpilotInvite(id: string) {
    setSending("trustpilot");
    try {
      const res = await fetch(`/api/orders/${id}/trustpilot`, { method: "POST" });
      const data = await res.json();
      if (res.ok) showToast("Invitation Trustpilot envoyée ✓");
      else showToast(`Échec : ${data.error ?? "erreur inconnue"}`, false);
    } catch {
      showToast("Erreur réseau", false);
    }
    setSending(null);
  }

  async function handleReviewEmail(order: Order) {
    setReviewSending("email");
    try {
      const res = await fetch(`/api/orders/${order.id}/trustpilot`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { showToast("Email d'avis envoyé ✓"); setReviewModal(null); }
      else showToast(`Échec : ${data.error ?? "erreur inconnue"}`, false);
    } catch {
      showToast("Erreur réseau", false);
    }
    setReviewSending(null);
  }

  function handleReviewWhatsApp(order: Order) {
    window.open(buildWaUrl(order, "trustpilot"), "_blank");
    setReviewModal(null);
  }

  function handleTrustpilotWhatsApp(id: string) {
    const order = orders.find((o) => o.id === id);
    if (order) window.open(buildWaUrl(order, "trustpilot"), "_blank");
  }

  function handleProductReviewWhatsApp(id: string) {
    const order = orders.find((o) => o.id === id);
    if (order) window.open(buildWaUrl(order, "productReview"), "_blank", "noopener,noreferrer");
  }

  function exportCSV() {
    const cols = ["Commande","Source","Date","Nom","Téléphone","Email","Ville","Adresse","Produits","Total","Statut","Paiement","Suivi","Notes"];
    const rows = orders.map((o) => [
      o.order_number, o.order_source === "mobile_app" ? "Application" : "Site web", new Date(o.created_at).toLocaleDateString("fr-FR"),
      o.customer?.name ?? "", o.customer?.phone ?? "", o.customer?.email ?? "",
      o.customer?.city ?? "", o.customer?.address ?? "",
      (o.items ?? []).map((i) => `${i.name} x${i.qty}`).join(" | "),
      o.total, statusLabel(o.status), o.payment_method ?? "", o.tracking_number ?? "", o.notes ?? "",
    ]);
    const csv = [cols, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    await Promise.all([...selected].map((id) =>
      fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: bulkStatus }) })
    ));
    showToast(`${selected.size} commande(s) mises à jour ✓`);
    setSelected(new Set()); setBulkStatus(""); await load();
    setBulkUpdating(false);
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchSource = filterSource === "all" || (o.order_source ?? "website") === filterSource;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.order_number?.includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.customer?.email?.toLowerCase().includes(q);
    return matchStatus && matchSource && matchSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* LEFT: List */}
      <div className={`flex flex-col min-w-0 transition-all ${detail ? "hidden lg:flex lg:w-[52%] lg:flex-shrink-0" : "flex-1"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black">Commandes</h1>
            <p className="text-neutral-500 text-xs mt-0.5">
              {loading ? "Chargement…" : `${orders.length} commande${orders.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold hover:border-black transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
        </div>

        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, téléphone, numéro, email…"
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-black bg-white" />
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {[{ value: "all", label: "Toutes" }, ...STATUS_OPTIONS].map((s) => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all
                ${filterStatus === s.value ? "bg-black text-white border-black" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
              {s.label}
            </button>
          ))}
          <span aria-hidden="true" className="mx-1 h-7 w-px bg-neutral-200" />
          {([
            { value: "all", label: "Tous les canaux" },
            { value: "website", label: "Site web" },
            { value: "mobile_app", label: "Application" },
          ] as const).map((source) => (
            <button
              key={source.value}
              type="button"
              onClick={() => setFilterSource(source.value)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                filterSource === source.value
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-neutral-200 text-neutral-500 hover:border-emerald-500"
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>

        {loadError && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{loadError}</span>
            <button type="button" onClick={() => void load()} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 font-black text-red-700 transition hover:border-red-400">
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex-1">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-sm">Aucune commande trouvée.</div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="lg:hidden divide-y divide-neutral-50">
                  {filtered.map((o) => (
                    <div key={o.id}
                      onClick={() => router.replace(detailId === o.id ? "/admin/orders" : `/admin/orders?id=${o.id}`)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-neutral-50 transition-colors ${selected.has(o.id) ? "bg-blue-50/50" : ""}`}>
                      <input type="checkbox" checked={selected.has(o.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(o.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-neutral-300 cursor-pointer shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-bold text-sm truncate">{o.customer?.name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                            #{o.order_number}
                            {o.order_source === "mobile_app" && <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-sans text-[8px] font-black uppercase text-emerald-700">App</span>}
                          </p>
                          <p className="text-xs font-bold shrink-0">{o.total} MAD</p>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{o.customer?.phone} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {o.status === "delivered" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReviewModal(o); }}
                          title="Demander un avis"
                          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors text-base">
                          ⭐
                        </button>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <table className="hidden lg:table w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase tracking-wide">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={() => selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map((o) => o.id)))}
                        className="rounded border-neutral-300 cursor-pointer" />
                    </th>
                    <th className="text-left px-2 py-3">Client</th>
                    <th className="text-left px-3 py-3">Commande</th>
                    <th className="text-right px-3 py-3">Total</th>
                    <th className="text-center px-3 py-3">Paiement</th>
                    <th className="text-center px-3 py-3">Statut</th>
                    <th className="text-center px-2 py-3">Avis</th>
                    <th className="text-right px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map((o) => (
                    <tr key={o.id}
                      onClick={() => router.replace(detailId === o.id ? "/admin/orders" : `/admin/orders?id=${o.id}`)}
                      className={`cursor-pointer transition-colors
                        ${detailId === o.id ? "bg-black text-white" : selected.has(o.id) ? "bg-blue-50/40 hover:bg-blue-50" : "hover:bg-neutral-50"}`}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)}
                          className="rounded border-neutral-300 cursor-pointer" />
                      </td>
                      <td className="px-2 py-3">
                        <p className={`font-semibold text-sm ${detailId === o.id ? "text-white" : ""}`}>{o.customer?.name}</p>
                        <p className={`text-xs ${detailId === o.id ? "text-white/60" : "text-neutral-400"}`}>{o.customer?.phone}</p>
                      </td>
                      <td className={`px-3 py-3 text-xs font-mono ${detailId === o.id ? "text-white/70" : "text-neutral-400"}`}>
                        #{o.order_number}
                        {o.order_source === "mobile_app" && <span className={`ml-1.5 rounded px-1.5 py-0.5 font-sans text-[8px] font-black uppercase ${detailId === o.id ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}>App</span>}
                      </td>
                      <td className={`px-3 py-3 text-right font-bold text-sm ${detailId === o.id ? "text-white" : ""}`}>{o.total} MAD</td>
                      <td className="px-3 py-3 text-center">
                        {(o.payment_method ?? "").toLowerCase().startsWith("paypal")
                          ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${detailId === o.id ? "bg-blue-400/20 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 46" width="10" height="12"><path fill="currentColor" d="M9.12 40.43l.72-4.56-1.6-.04H1.46L6.79 1.77A.43.43 0 0 1 7.22 1.4h12.9c4.28 0 7.23.89 8.77 2.65.72.82 1.18 1.68 1.4 2.63.23.99.24 2.18.01 3.63l-.02.1v.93l.72.41c.6.33 1.09.72 1.47 1.11.62.7 1.02 1.6 1.19 2.66.17 1.09.12 2.39-.17 3.86-.33 1.69-.86 3.16-1.58 4.37a8.98 8.98 0 0 1-2.51 2.83c-.95.7-2.09 1.22-3.37 1.57-1.25.34-2.67.51-4.23.51H21.3a3.03 3.03 0 0 0-2.99 2.56l-.07.41-1.46 9.27-.07.34a.43.43 0 0 1-.43.37H9.12z"/></svg>
                              PayPal
                            </span>
                          : <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${detailId === o.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>COD</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-center">
                        {detailId === o.id
                          ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 text-white whitespace-nowrap">{statusLabel(o.status)}</span>
                          : <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                        }
                      </td>
                      <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {o.status === "delivered" ? (
                          <button
                            onClick={() => setReviewModal(o)}
                            title="Demander un avis Trustpilot"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 text-[10px] font-bold transition-colors whitespace-nowrap">
                            ⭐ Avis
                          </button>
                        ) : <span className="text-neutral-200">—</span>}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs ${detailId === o.id ? "text-white/60" : "text-neutral-400"}`}>
                        {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Detail panel */}
      {detail && (
        <div className="fixed inset-0 z-50 h-[100dvh] overflow-y-auto bg-neutral-50 pb-[max(2rem,env(safe-area-inset-bottom))] lg:relative lg:inset-auto lg:z-auto lg:h-auto lg:max-h-[calc(100vh-7rem)] lg:min-w-0 lg:flex-1 lg:bg-white lg:pb-0">
          {/* Mobile back header */}
          <div className="sticky top-0 z-20 mb-3 flex items-center gap-3 border-b border-neutral-200/80 bg-white/95 px-3 py-3 backdrop-blur-xl lg:hidden">
            <button onClick={() => router.replace("/admin/orders")}
              aria-label="Retour aux commandes"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black">#{detail.order_number}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusColor(detail.status)}`}>{statusLabel(detail.status)}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400">{new Date(detail.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <button onClick={() => window.open(`/admin/orders/invoice?id=${detail.id}`, "_blank")} aria-label="Ouvrir la facture" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>
            </button>
          </div>
          {/* Header */}
          <div className="mb-4 hidden items-start justify-between lg:flex">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black">#{detail.order_number}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(detail.status)}`}>
                  {statusLabel(detail.status)}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{new Date(detail.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(`/admin/orders/print?id=${detail.id}`, "_blank")}
                className="p-2 border border-neutral-200 rounded-xl hover:border-black transition-colors" title="Imprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              <button onClick={() => window.open(`/admin/orders/vat-invoice?id=${detail.id}`, "_blank")}
                className="p-2 border border-neutral-200 rounded-xl hover:border-black transition-colors" title="Facture TVA">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </button>
              <button onClick={() => window.open(`/admin/orders/invoice?id=${detail.id}`, "_blank")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors" title="Facture Pro">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>
                Facture Pro
              </button>
              <button onClick={() => router.replace("/admin/orders")}
                className="p-2 border border-neutral-200 rounded-xl hover:border-black transition-colors" title="Fermer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {toast && (
            <div role="status" className={`mx-3 mb-3 flex items-start gap-3 rounded-xl border px-3.5 py-3 text-xs shadow-sm lg:mx-0 ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>{toast.ok ? "✓" : "!"}</span>
              <div>
                <p className="font-black">{toast.ok ? "Action terminée" : "Action à vérifier"}</p>
                <p className="mt-0.5 leading-5 opacity-80">{toast.msg}</p>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-2xl space-y-3 px-3 lg:max-w-none lg:px-0">

            {/* Actions — pick status then channel */}
            <Section title="Actions">
              {pendingAction ? (() => {
                const ACTION_META = {
                  confirmed: { label: "Confirmer",  icon: "✓",  cls: "bg-blue-600" },
                  shipped:   { label: "Expédier",   icon: "🚚", cls: "bg-purple-600" },
                  delivered: { label: "Livrée",     icon: "🎉", cls: "bg-emerald-600" },
                  cancelled: { label: "Annuler",    icon: "✕",  cls: "bg-red-500" },
                };
                const meta = ACTION_META[pendingAction];
                if (pendingAction === "delivered") {
                  return (
                    <div>
                      <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">✓</span>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-emerald-950">Confirmer la livraison ?</p>
                          <p className="mt-1 text-[11px] leading-5 text-emerald-800">
                            Cette action marque la commande comme livrée et lance automatiquement la séquence d&apos;avis client.
                          </p>
                        </div>
                      </div>
                      <div className="mb-4 space-y-3 border-l-2 border-emerald-200 pl-4">
                        <div>
                          <p className="text-[11px] font-black text-neutral-800">Maintenant · Avis produit</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">Un email personnalisé présente chaque article avec un lien direct pour déposer un avis.</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-neutral-800">Dans 2 jours · Avis sur les produits</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">Un rappel personnalisé affiche les articles achetés, avec un bouton d'avis pour chacun et Trustpilot en option.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => confirmDelivery(detail.id)}
                        disabled={!!sending}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                        {sending === "delivery" ? "Confirmation en cours…" : "Confirmer et lancer l'autopilote"}
                      </button>
                      <button onClick={() => setPendingAction(null)} className="mt-2 w-full py-2 text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-700">
                        Retour aux actions
                      </button>
                    </div>
                  );
                }
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold ${meta.cls}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-xs text-neutral-400">— Comment notifier le client ?</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Email */}
                      {detail.customer?.email ? (
                        <button
                          onClick={() => handleEmail(detail.id, pendingAction)}
                          disabled={!!sending}
                          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 transition-all disabled:opacity-50">
                          {sending === "email"
                            ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                          <span className="text-xs font-bold">Email</span>
                          <span className="text-[10px] opacity-60">Automatique</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
                          <span className="text-[10px]">Pas d&apos;email</span>
                        </div>
                      )}
                      {/* WhatsApp */}
                      {detail.customer?.phone ? (
                        <button
                          onClick={() => handleWhatsApp(detail.id, pendingAction)}
                          disabled={!!sending}
                          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-[#25D366] bg-[#25D366] text-white hover:bg-[#1db954] transition-all disabled:opacity-50">
                          {sending === "whatsapp"
                            ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
                            : <WaIcon />}
                          <span className="text-xs font-bold">WhatsApp</span>
                          <span className="text-[10px] opacity-70">Manuel</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                          <WaIcon />
                          <span className="text-[10px]">Pas de tél.</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setPendingAction(null)}
                      className="w-full text-xs text-neutral-400 hover:text-black transition-colors py-1.5">
                      ← Annuler
                    </button>
                  </div>
                );
              })() : (
                <>
                  <p className="mb-3 text-[11px] leading-5 text-neutral-500">
                    Mettez à jour l&apos;étape de la commande. Vous pourrez ensuite choisir comment prévenir le client.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { type: "confirmed", label: "Confirmer",  icon: "✓",  cls: "text-blue-700 bg-blue-50 border-blue-100 hover:border-blue-300" },
                      { type: "shipped",   label: "Expédier",   icon: "↗", cls: "text-violet-700 bg-violet-50 border-violet-100 hover:border-violet-300" },
                      { type: "delivered", label: "Marquer livrée", icon: "✓", cls: "text-emerald-700 bg-emerald-50 border-emerald-100 hover:border-emerald-300" },
                      { type: "cancelled", label: "Annuler",    icon: "×",  cls: "text-red-700 bg-red-50 border-red-100 hover:border-red-300" },
                    ] as const).map(({ type, label, icon, cls }) => {
                      const isCurrent = detail.status === type;
                      return (
                        <button key={type}
                          onClick={() => setPendingAction(type)}
                          className={`flex min-h-12 items-center justify-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition-all
                            ${isCurrent ? "ring-2 ring-current ring-offset-1" : ""} ${cls}`}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm shadow-sm">{icon}</span>
                          {label}
                          {isCurrent && <span className="ml-auto text-[8px] uppercase opacity-60">Actuel</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-2 text-[10px] text-neutral-400 flex-wrap">
                    {detail.customer?.email && <span>✉ {detail.customer.email}</span>}
                    {detail.customer?.phone && <span>📱 {detail.customer.phone}</span>}
                  </div>
                </>
              )}
            </Section>

            {/* Trustpilot */}
            <Section title="Avis clients · Autopilote">
              <div className={`mb-3 rounded-xl border p-3 ${detail.status === "delivered" ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-neutral-50"}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${detail.status === "delivered" ? "bg-emerald-600 text-white" : "bg-white text-neutral-400 shadow-sm"}`}>{detail.status === "delivered" ? "✓" : "⏱"}</span>
                  <div>
                    <p className="text-[11px] font-black text-neutral-800">{detail.status === "delivered" ? "Séquence automatique activée" : "Démarre automatiquement à la livraison"}</p>
                    <p className="mt-1 text-[10px] leading-4 text-neutral-500">Avis produit par email et WhatsApp dès la livraison, puis rappel produits + Trustpilot 2 jours plus tard. WhatsApp automatique utilise vos modèles Meta approuvés.</p>
                  </div>
                </div>
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Avis produits achetés</p>
              {detail.customer?.phone ? (
                <button onClick={() => handleProductReviewWhatsApp(detail.id)} disabled={!!sending}
                  className="mb-3 flex w-full items-center justify-between rounded-xl bg-[#111] px-4 py-3 text-left text-white transition hover:bg-neutral-800 disabled:opacity-50">
                  <span><span className="block text-xs font-bold">WhatsApp · Avis produits</span><span className="mt-0.5 block text-[10px] text-white/60">Liens directs vers les articles achetés</span></span>
                  <WaIcon />
                </button>
              ) : null}
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Avis Trustpilot</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Email */}
                {detail.customer?.email ? (
                  <button
                    onClick={() => handleTrustpilotInvite(detail.id)}
                    disabled={!!sending}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-[#00b67a] hover:bg-[#00a36c] text-white text-xs font-bold transition-all disabled:opacity-50">
                    {sending === "trustpilot"
                      ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                    <span>Email ⭐</span>
                    <span className="text-[10px] opacity-70">Envoyer maintenant</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
                    <span className="text-[10px]">Pas d&apos;email</span>
                  </div>
                )}
                {/* WhatsApp */}
                {detail.customer?.phone ? (
                  <button
                    onClick={() => handleTrustpilotWhatsApp(detail.id)}
                    disabled={!!sending}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-[#25D366] bg-[#25D366] text-white hover:bg-[#1db954] transition-all disabled:opacity-50">
                    <WaIcon />
                    <span className="text-xs font-bold">WhatsApp ⭐</span>
                    <span className="text-[10px] opacity-70">Manuel</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                    <WaIcon />
                    <span className="text-[10px]">Pas de tél.</span>
                  </div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-neutral-400 space-y-0.5">
                {detail.customer?.email && <p>✉ {detail.customer.email}</p>}
                {detail.customer?.phone && <p>📱 {detail.customer.phone}</p>}
              </div>
            </Section>

            {/* Tracking */}
            <Section title="Numéro de suivi">
              {detail.tracking_number && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span className="text-sm font-black text-purple-700 tracking-widest">{detail.tracking_number}</span>
                </div>
              )}
              <div className="flex flex-col gap-2 min-[380px]:flex-row">
                <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveTracking(detail.id)}
                  placeholder="Ex: MA123456789FR"
                  className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors" />
                <button onClick={() => saveTracking(detail.id)} disabled={trackingSaving}
                  className="min-h-11 w-full rounded-xl bg-black px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 min-[380px]:w-auto whitespace-nowrap">
                  {trackingSaving ? "…" : "Sauver"}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">Visible par le client dans &quot;Suivre ma commande&quot;.</p>
            </Section>

            {/* Client */}
            <Section title="Client">
              <div className="space-y-1.5">
                <Row label="Nom"     value={detail.customer?.name} />
                <Row label="Tél."    value={detail.customer?.phone} />
                <Row label="Email"   value={detail.customer?.email} />
                <Row label="Ville"   value={detail.customer?.city} />
                <Row label="Adresse" value={detail.customer?.address} />
              </div>
            </Section>

            {/* Items */}
            <Section title="Articles">
              <div className="space-y-2">
                {detail.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-lg bg-neutral-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400">
                        Qté : {item.qty}{item.color ? ` · ${item.color}` : ""}{item.size ? ` · ${item.size}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0">{(item.price * item.qty).toFixed(0)} MAD</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between text-sm">
                <span className="text-neutral-500">Total</span>
                <span className="font-black">{detail.total} MAD</span>
              </div>
            </Section>

            {/* Payment */}
            <Section title="Paiement">
              {(detail.payment_method ?? "").toLowerCase().startsWith("paypal") ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-black px-3 py-1.5 rounded-full border border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 46" width="10" height="13"><path fill="#253B80" d="M9.12 40.43l.72-4.56-1.6-.04H1.46L6.79 1.77A.43.43 0 0 1 7.22 1.4h12.9c4.28 0 7.23.89 8.77 2.65.72.82 1.18 1.68 1.4 2.63.23.99.24 2.18.01 3.63l-.02.1v.93l.72.41c.6.33 1.09.72 1.47 1.11.62.7 1.02 1.6 1.19 2.66.17 1.09.12 2.39-.17 3.86-.33 1.69-.86 3.16-1.58 4.37a8.98 8.98 0 0 1-2.51 2.83c-.95.7-2.09 1.22-3.37 1.57-1.25.34-2.67.51-4.23.51H21.3a3.03 3.03 0 0 0-2.99 2.56l-.07.41-1.46 9.27-.07.34a.43.43 0 0 1-.43.37H9.12z"/><path fill="#179BD7" d="M31.68 10.54a12.35 12.35 0 0 0-.13.76c-1.7 8.72-7.51 11.74-14.93 11.74H12.8c-.9 0-1.67.66-1.81 1.55L8.89 36.88l-.55 3.48a.97.97 0 0 0 .96 1.12h6.7c.79 0 1.47-.58 1.59-1.36l.07-.34 1.26-8.01.08-.44c.13-.78.8-1.36 1.59-1.36h1c6.5 0 11.59-2.64 13.07-10.27.62-3.19.3-5.85-1.8-7.73a6.44 6.44 0 0 0-1.18-.43z"/><path fill="#222D65" d="M29.95 9.82a16.93 16.93 0 0 0-1.65-.37 21.03 21.03 0 0 0-3.33-.25H14.63a1.61 1.61 0 0 0-1.59 1.36L11 22.55l-.06.4a1.84 1.84 0 0 1 1.81-1.55h3.79c7.42 0 13.23-3.02 14.93-11.74.05-.25.09-.5.13-.76a9.16 9.16 0 0 0-1.65-.08z"/></svg>
                      Payé via PayPal
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Confirmé
                    </span>
                  </div>
                  {detail.payment_method.includes("(") && (
                    <p className="text-[11px] text-neutral-400 font-mono bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                      ID transaction : {detail.payment_method.match(/\(([^)]+)\)/)?.[1] ?? ""}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/><path d="M6 15h2M10 15h4"/></svg>
                  <p className="text-sm font-semibold">Paiement à la livraison (espèces)</p>
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section title="Notes internes">
              <textarea rows={3} value={notesInput} onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Notes visibles uniquement par l'équipe admin…"
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white resize-none transition-all" />
              <button onClick={() => saveNotes(detail.id)} disabled={notesSaving}
                className="mt-1.5 w-full border border-neutral-200 text-xs font-semibold py-2 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50">
                {notesSaving ? "Enregistrement…" : "Enregistrer la note"}
              </button>
            </Section>

          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-black text-base">Demander un avis ⭐</p>
                <p className="text-xs text-neutral-500 mt-0.5">{reviewModal.customer?.name} · #{reviewModal.order_number}</p>
              </div>
              <button onClick={() => setReviewModal(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
              Envoyez au client le lien pour laisser un avis sur{" "}
              <span className="font-bold text-amber-700">Trustpilot</span> :{" "}
              <span className="font-mono text-[10px] text-amber-800">trustpilot.com/evaluate/lecomax.com</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              {reviewModal.customer?.phone ? (
                <button
                  onClick={() => handleReviewWhatsApp(reviewModal)}
                  disabled={!!reviewSending}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white font-bold text-sm transition-all disabled:opacity-50">
                  <WaIcon />
                  <span className="text-xs font-bold">WhatsApp</span>
                  <span className="text-[10px] opacity-70">{reviewModal.customer.phone}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                  <WaIcon />
                  <span className="text-[10px]">Pas de tél.</span>
                </div>
              )}
              {/* Email */}
              {reviewModal.customer?.email ? (
                <button
                  onClick={() => handleReviewEmail(reviewModal)}
                  disabled={!!reviewSending}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-[#00b67a] hover:bg-[#00a36c] text-white font-bold text-sm transition-all disabled:opacity-50">
                  {reviewSending === "email"
                    ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  <span className="text-xs font-bold">Email</span>
                  <span className="text-[10px] opacity-70 truncate max-w-full px-1">{reviewModal.customer.email}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border border-dashed border-neutral-200 text-neutral-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
                  <span className="text-[10px]">Pas d&apos;email</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 lg:left-[calc(50%+8rem)] -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900 text-white pl-4 pr-3 py-2.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] border border-white/10 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-2 pr-3 border-r border-white/15 shrink-0">
            <div className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">{selected.size}</div>
            <span className="text-sm font-semibold text-white/80 whitespace-nowrap">sélectionnée{selected.size > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 px-1 overflow-x-auto">
            {STATUS_OPTIONS.map((s) => (
              <button key={s.value} onClick={() => setBulkStatus(bulkStatus === s.value ? "" : s.value)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all shrink-0
                  ${bulkStatus === s.value ? "bg-white text-black" : "text-white/50 hover:text-white hover:bg-white/10"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/15 mx-1 shrink-0" />
          <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-sm font-black rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-30 whitespace-nowrap shrink-0">
            {bulkUpdating
              ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            Appliquer
          </button>
          <button onClick={() => { setSelected(new Set()); setBulkStatus(""); }}
            className="ml-1 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-4">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-neutral-400 w-16 flex-shrink-0">{label}</span>
      <span className="min-w-0 break-words font-medium">{value || "—"}</span>
    </div>
  );
}
