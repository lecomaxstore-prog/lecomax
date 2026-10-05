"use client";
import { RETURN_POLICY } from "@/lib/return-policy";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/supabase";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "#92400e", bg: "#fef3c7" },
  confirmed: { label: "Confirmée",   color: "#1e40af", bg: "#dbeafe" },
  shipped:   { label: "Expédiée",    color: "#5b21b6", bg: "#ede9fe" },
  delivered: { label: "Livrée",      color: "#065f46", bg: "#d1fae5" },
  cancelled: { label: "Annulée",     color: "#991b1b", bg: "#fee2e2" },
};

export default function PublicFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data as Order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f0ee", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 13, color: "#9ca3af" }}>Chargement de votre facture…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f0ee", gap: 12, fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Facture introuvable</div>
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Ce lien est invalide ou a expiré.</div>
      </div>
    );
  }

  const itemsTotal = order.items.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);
  const delivery = parseFloat(Math.max(0, order.total - itemsTotal).toFixed(2));
  const invoiceNumber = `FAC-${order.order_number}`;
  const dateStr = new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "#374151", bg: "#f3f4f6" };
  const isDelivered = order.status === "delivered";
  const fmt = (n: number) => `${n.toFixed(2)} MAD`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background: #f0f0ee; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { border-collapse: collapse; width: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .inv { animation: fadeUp 0.35s ease; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .wrap { padding: 0 !important; }
          .inv { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
        @media (max-width: 600px) {
          .parties-grid { grid-template-columns: 1fr !important; }
          .meta-grid { grid-template-columns: 1fr 1fr !important; }
          .hide-mobile { display: none !important; }
          .pad { padding: 20px 20px !important; }
          .hpad { padding: 28px 20px !important; }
        }
      `}</style>

      {/* Sticky download bar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
          <span style={{ fontWeight: 900, fontSize: 18, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{invoiceNumber}</span>
        </div>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Enregistrer PDF
        </button>
      </div>

      <div className="wrap" style={{ padding: "24px 12px 48px" }}>
        <div className="inv" style={{ maxWidth: 760, margin: "0 auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.10)", overflow: "hidden" }}>

          {/* Green top bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg,#166534,#16a34a,#3ecf4c,#4ade80,#86efac)" }} />

          {/* Dark header */}
          <div className="hpad" style={{ background: "#0c1a12", padding: "36px 44px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,0.18) 0%,transparent 70%)" }} />
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
                  <span style={{ fontWeight: 900, fontSize: 30, color: "#fff", letterSpacing: "-1px" }}>L&apos;eco</span>
                  <span style={{ fontWeight: 900, fontSize: 30, color: "#4ade80", letterSpacing: "-1px" }}>max</span>
                </div>
                <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#4ade80 30%,#4ade80 80%,transparent)", borderRadius: 2, marginTop: 2, width: "55%", marginLeft: "45%" }} />
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 6, letterSpacing: 1.5, fontWeight: 600 }}>BOUTIQUE EN LIGNE · MAROC</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, lineHeight: 2.1, marginTop: 14 }}>
                  <div>contact@lecomax.com</div>
                  <div>lecomax.com · Maroc</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5, marginBottom: 14, background: "rgba(74,222,128,0.08)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 9, letterSpacing: 3 }}>FACTURE</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 10 }}>{invoiceNumber}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, lineHeight: 2 }}>
                  <div>Date : <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{dateStr}</span></div>
                  <div>Commande : <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>#{order.order_number}</span></div>
                </div>
                {isDelivered && (
                  <div style={{ marginTop: 16, display: "inline-block", transform: "rotate(-6deg)", filter: "drop-shadow(0 0 10px rgba(74,222,128,0.3))" }}>
                    <div style={{ padding: "6px 20px", border: "2.5px solid #4ade80", borderRadius: 50, color: "#4ade80", fontWeight: 900, fontSize: 12, letterSpacing: 4, position: "relative" }}>
                      <div style={{ position: "absolute", inset: 3, border: "1px dashed rgba(74,222,128,0.4)", borderRadius: 50 }} />
                      ✓ PAYÉE
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: 28, height: 1, background: "linear-gradient(90deg,rgba(74,222,128,0.5),rgba(74,222,128,0.03))" }} />
          </div>

          {/* DE / FACTURÉ À */}
          <div className="parties-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div className="pad" style={{ padding: "24px 44px", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", borderLeft: "3px solid #3ecf4c" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>DE</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1, marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 17, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
                <span style={{ fontWeight: 900, fontSize: 17, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
              </div>
              <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#3ecf4c 30%,#3ecf4c 80%,transparent)", borderRadius: 2, marginBottom: 10, width: "45%", marginLeft: "30%" }} />
              <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.9 }}>
                <div>contact@lecomax.com</div><div>lecomax.com</div><div>Maroc</div>
              </div>
            </div>
            <div className="pad" style={{ padding: "24px 44px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>FACTURÉ À</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 8, textTransform: "capitalize" }}>{order.customer?.name || "—"}</div>
              <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.9 }}>
                {order.customer?.phone && <div>{order.customer.phone}</div>}
                {order.customer?.email && <div>{order.customer.email}</div>}
                {order.customer?.address && <div>{order.customer.address}</div>}
                {order.customer?.city && <div>{order.customer.city}, Maroc</div>}
              </div>
            </div>
          </div>

          {/* STATUT / PAIEMENT / LIVRAISON */}
          <div className="meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
            {[
              { label: "STATUT", content: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: status.bg, color: status.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.color, display: "inline-block" }} />{status.label}
                </span>
              )},
              { label: "PAIEMENT", content: <span style={{ fontWeight: 600, fontSize: 12, color: "#111827" }}>{order.payment_method || "À la livraison"}</span> },
              { label: "LIVRAISON", content: order.tracking_number
                ? <span style={{ fontWeight: 600, fontSize: 11, color: "#111827", fontFamily: "monospace", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>{order.tracking_number}</span>
                : <span style={{ fontWeight: 600, fontSize: 12, color: "#111827" }}>Partout au Maroc</span>
              },
            ].map((cell, i) => (
              <div key={i} className="pad" style={{ padding: "16px 44px", borderRight: i < 2 ? "1px solid #f3f4f6" : undefined }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>{cell.label}</div>
                {cell.content}
              </div>
            ))}
          </div>

          {/* Articles table */}
          <div className="pad" style={{ padding: "28px 44px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase" }}>ARTICLES COMMANDÉS</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#3ecf4c", borderRadius: 99, padding: "1px 7px", lineHeight: 1.8 }}>{order.items.length}</span>
            </div>
            <table style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #f3f4f6" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th className="hide-mobile" style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #f3f4f6", width: 28 }}>#</th>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #f3f4f6" }}>Produit</th>
                  <th style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #f3f4f6", width: 30 }}>Qté</th>
                  <th className="hide-mobile" style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #f3f4f6", width: 90 }}>Prix</th>
                  <th style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #f3f4f6", width: 90 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: { id: string; name: string; price: number; qty: number; image: string; size?: string; color?: string }, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td className="hide-mobile" style={{ padding: "14px 12px", color: "#d1d5db", fontWeight: 700, fontSize: 10 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {item.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.image.startsWith("http") ? item.image : `https://lecomax.com${item.image}`} alt={item.name} style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid #f3f4f6", flexShrink: 0, background: "#f9fafb" }} />
                          : <div style={{ width: 46, height: 46, borderRadius: 8, background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                        }
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {item.size && <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{item.size}</span>}
                            {item.color && <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{item.color}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#374151" }}>{item.qty}</td>
                    <td className="hide-mobile" style={{ padding: "14px 12px", textAlign: "right", color: "#9ca3af", fontSize: 12 }}>{item.price.toFixed(2)} MAD</td>
                    <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#111827" }}>{(item.price * item.qty).toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="pad" style={{ padding: "18px 44px 28px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 280 }}>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                {[
                  ["Sous-total articles", fmt(itemsTotal)],
                  ["Frais de livraison", delivery === 0 ? "Gratuit" : fmt(delivery)],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #f3f4f6" }}>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{label}</span>
                    <span style={{ fontWeight: 500, fontSize: 12, color: delivery === 0 && label === "Frais de livraison" ? "#16a34a" : "#374151" }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "18px 20px", background: "linear-gradient(135deg,#0c1a12,#0f2618)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(74,222,128,0.15)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -15, top: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.1)" }} />
                <div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>TOTAL À PAYER</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Toutes taxes comprises</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "#4ade80", letterSpacing: "-0.5px" }}>{fmt(order.total)}</div>
                  <div style={{ fontSize: 9, color: "rgba(74,222,128,0.45)", marginTop: 2, letterSpacing: 1 }}>MAD · MAROC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: "linear-gradient(180deg,#f9fafb,#f3f4f6)", borderTop: "1px solid #e5e7eb", padding: "20px 44px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>contact@lecomax.com · lecomax.com</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 4 }}>
                  {["#4ade80","#86efac","#d1fae5"].map((c,i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />)}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Merci pour votre confiance !</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Émise le {dateStr}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Réf : {invoiceNumber}</div>
              </div>
            </div>
            <div style={{ height: 1, background: "#e5e7eb", marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[RETURN_POLICY.summary, delivery === 0 ? "Livraison gratuite" : `Livraison ${delivery.toFixed(0)} MAD au Maroc`, "Paiement sécurisé"].map(t => (
                  <span key={t} style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>✓ {t}</span>
                ))}
              </div>
              <span style={{ fontSize: 9, color: "#d1d5db", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>Document généré automatiquement</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
