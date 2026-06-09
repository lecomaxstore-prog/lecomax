"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/supabase";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "#92400e", bg: "#fef3c7" },
  confirmed: { label: "Confirmée",   color: "#1e40af", bg: "#dbeafe" },
  shipped:   { label: "Expédiée",    color: "#5b21b6", bg: "#ede9fe" },
  delivered: { label: "Livrée",      color: "#065f46", bg: "#d1fae5" },
  cancelled: { label: "Annulée",     color: "#991b1b", bg: "#fee2e2" },
};

export default function InvoicePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/orders/${id}`).then((r) => r.json()).then((data) => {
      setOrder(data as Order);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fafafa", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 13, color: "#9ca3af" }}>Préparation de la facture…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#9ca3af", fontFamily: "Inter, Arial, sans-serif", fontSize: 14 }}>
        Commande introuvable.
      </div>
    );
  }

  const itemsTotal = order.items.reduce((sum: number, i: { price: number; qty: number }) => sum + i.price * i.qty, 0);
  const delivery = parseFloat(Math.max(0, order.total - itemsTotal).toFixed(2));
  const orderTotal = order.total;
  const invoiceNumber = `FAC-${order.order_number}`;
  const invoiceDate = new Date(order.created_at);
  const dateStr = invoiceDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "#374151", bg: "#f3f4f6" };
  const isDelivered = order.status === "delivered";
  const fmt = (n: number) => `${n.toFixed(2)} MAD`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          font-size: 13px; color: #111827; background: #f3f4f6;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        table { border-collapse: collapse; width: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .invoice-doc { animation: fadeUp 0.4s ease; }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-page { padding: 0 !important; background: #fff !important; }
          .invoice-doc { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; animation: none !important; }
        }
      `}</style>

      <div className="no-print" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb", padding: "11px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "Inter, Arial, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
              <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 22, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
              <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 22, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
            </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>Facture {invoiceNumber}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{dateStr}</div>
          </div>
          <span style={{ marginLeft: 4, padding: "3px 10px", background: status.bg, color: status.color, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{status.label}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Télécharger PDF
          </button>
          <button onClick={() => window.close()} style={{ padding: "8px 14px", background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Fermer</button>
        </div>
      </div>

      <div className="print-page" style={{ padding: "80px 24px 60px", minHeight: "100vh" }}>
        <div className="invoice-doc" style={{ maxWidth: 820, margin: "0 auto", background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 48px rgba(0,0,0,0.10)", overflow: "hidden" }}>
          {/* Premium top accent bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #166534 0%, #16a34a 25%, #3ecf4c 50%, #4ade80 75%, #86efac 100%)", borderRadius: "0" }} />

          <div style={{ background: "#0c1a12", padding: "44px 52px 40px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div style={{ position: "absolute", right: -80, top: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", left: -40, bottom: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
                      <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 34, color: "#ffffff", letterSpacing: "-1px" }}>L&apos;eco</span>
                      <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 34, color: "#4ade80", letterSpacing: "-1px" }}>max</span>
                    </div>
                    <div style={{ height: 3, background: "linear-gradient(90deg, transparent 0%, #4ade80 30%, #4ade80 80%, transparent 100%)", borderRadius: 2, marginTop: 2, width: "55%", marginLeft: "45%" }} />
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6, letterSpacing: 1.5, fontWeight: 600 }}>BOUTIQUE EN LIGNE · MAROC</div>
                  </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 2.1 }}>
                  <div>contact@lecomax.com</div>
                  <div>lecomax.com</div>
                  <div>Maroc</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 6, marginBottom: 18, background: "rgba(74,222,128,0.08)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                  <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>FACTURE</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 30, color: "#fff", letterSpacing: "-1px", lineHeight: 1, marginBottom: 12 }}>{invoiceNumber}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 2.1 }}>
                  <div>Date: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{dateStr}</span></div>
                  <div>Commande: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>#{order.order_number}</span></div>
                </div>
                {isDelivered && (
                  <div style={{ marginTop: 20, display: "inline-block", transform: "rotate(-6deg)", filter: "drop-shadow(0 0 12px rgba(74,222,128,0.35))" }}>
                    <div style={{ padding: "8px 24px", border: "3px solid #4ade80", borderRadius: 50, color: "#4ade80", fontWeight: 900, fontSize: 14, letterSpacing: 4, textTransform: "uppercase", fontFamily: "Inter, sans-serif", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 3, border: "1.5px dashed rgba(74,222,128,0.4)", borderRadius: 50 }} />
                      ✓ PAYÉE
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: 32, height: 1, background: "linear-gradient(90deg, rgba(74,222,128,0.6), rgba(74,222,128,0.05))" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "28px 52px", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", borderLeft: "3px solid #3ecf4c" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>DE</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
                  <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 20, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
                  <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 20, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
                </div>
                <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #3ecf4c 30%, #3ecf4c 80%, transparent 100%)", borderRadius: 2, marginTop: 2, width: "55%", marginLeft: "45%" }} />
              </div>
              <div style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 1.9 }}>
                <div>contact@lecomax.com</div><div>lecomax.com</div><div>Maroc</div>
              </div>
            </div>
            <div style={{ padding: "28px 52px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>FACTURÉ À</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 8, textTransform: "capitalize" }}>{order.customer?.name || "—"}</div>
              <div style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 1.9 }}>
                {order.customer?.phone && <div>{order.customer.phone}</div>}
                {order.customer?.email && <div>{order.customer.email}</div>}
                {order.customer?.address && <div>{order.customer.address}</div>}
                {order.customer?.city && <div>{order.customer.city}, Maroc</div>}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ padding: "20px 52px", borderRight: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>STATUT</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: status.bg, color: status.color, padding: "4px 12px", borderRadius: 20, fontWeight: 600, fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, display: "inline-block" }} />
                {status.label}
              </span>
            </div>
            <div style={{ padding: "20px 52px", borderRight: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>PAIEMENT</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{order.payment_method || "À la livraison"}</div>
            </div>
            <div style={{ padding: "20px 52px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>LIVRAISON</div>
              {order.tracking_number
                ? <div style={{ fontWeight: 600, fontSize: 12, color: "#111827", fontFamily: "monospace", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>{order.tracking_number}</div>
                : <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>Partout au Maroc</div>
              }
            </div>
          </div>

          <div style={{ padding: "32px 52px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 2.5, textTransform: "uppercase" }}>ARTICLES COMMANDÉS</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#3ecf4c", borderRadius: 99, padding: "1px 8px", lineHeight: 1.8 }}>{order.items.length}</div>
            </div>
            <table>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[["#","left","4%"],["Produit","left",""],["Qté","right","9%"],["Prix unitaire","right","17%"],["Total","right","17%"]].map(([h,a,w]) => (
                    <th key={h as string} style={{ padding: "11px 14px", textAlign: a as "left"|"right", fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", width: w as string || undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: { id: string; name: string; price: number; qty: number; image: string; size?: string; color?: string }, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "18px 14px", color: "#d1d5db", fontWeight: 700, fontSize: 11 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "18px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, border: "1px solid #f3f4f6", flexShrink: 0, background: "#f9fafb" }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827", lineHeight: 1.3, marginBottom: 5 }}>{item.name}</div>
                          {(item.size || item.color) && (
                            <div style={{ display: "flex", gap: 5 }}>
                              {item.size && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{item.size}</span>}
                              {item.color && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{item.color}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "18px 14px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#374151" }}>{item.qty}</td>
                    <td style={{ padding: "18px 14px", textAlign: "right", color: "#9ca3af", fontSize: 13 }}>{item.price.toFixed(2)} MAD</td>
                    <td style={{ padding: "18px 14px", textAlign: "right", fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{(item.price * item.qty).toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "28px 52px 32px" }}>
            <div style={{ width: 300 }}>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px dashed #f3f4f6" }}>
                  <span style={{ color: "#9ca3af", fontSize: 12.5 }}>Sous-total articles</span>
                  <span style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>{fmt(itemsTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px dashed #f3f4f6" }}>
                  <span style={{ color: "#9ca3af", fontSize: 12.5 }}>Frais de livraison</span>
                  {delivery === 0
                    ? <span style={{ fontWeight: 600, fontSize: 12, color: "#16a34a" }}>Gratuit</span>
                    : <span style={{ fontWeight: 500, fontSize: 13, color: "#374151" }}>{fmt(delivery)}</span>
                  }
                </div>
              </div>
              <div style={{ marginTop: 12, padding: "20px 24px", background: "linear-gradient(135deg, #0c1a12 0%, #0f2618 100%)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", border: "1px solid rgba(74,222,128,0.15)" }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(74,222,128,0.1)" }} />
                <div style={{ position: "absolute", left: -10, bottom: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(74,222,128,0.05)" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>TOTAL À PAYER</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Toutes taxes comprises</div>
                </div>
                <div style={{ textAlign: "right", position: "relative" }}>
                  <div style={{ fontWeight: 900, fontSize: 26, color: "#4ade80", letterSpacing: "-1px", lineHeight: 1 }}>{fmt(orderTotal)}</div>
                  <div style={{ fontSize: 9, color: "rgba(74,222,128,0.5)", marginTop: 3, letterSpacing: 1 }}>MAD · MAROC</div>
                </div>
              </div>
            </div>
          </div>

          {order.notes && (
            <div style={{ margin: "0 52px 32px", padding: "18px 22px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>NOTE DE COMMANDE</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{order.notes}</div>
            </div>
          )}

          <div style={{ background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)", borderTop: "1px solid #e5e7eb", padding: "24px 52px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
                    <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 18, color: "#111827", letterSpacing: "-0.5px" }}>L&apos;eco</span>
                    <span style={{ fontFamily: "Inter, Helvetica Neue, Arial, sans-serif", fontWeight: 900, fontSize: 18, color: "#3ecf4c", letterSpacing: "-0.5px" }}>max</span>
                  </div>
                  <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #3ecf4c 30%, #3ecf4c 80%, transparent 100%)", borderRadius: 2, marginTop: 2, width: "55%", marginLeft: "45%" }} />
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>contact@lecomax.com · lecomax.com</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 6 }}>
                  {["#4ade80","#86efac","#d1fae5"].map((c,i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />)}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Merci pour votre confiance !</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Émise le {dateStr}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Réf: {invoiceNumber}</div>
              </div>
            </div>
            <div style={{ height: 1, background: "#e5e7eb", margin: "0 0 14px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 20 }}>
                {["Retours acceptés sous 30 jours", "Livraison 35 MAD partout au Maroc", "Paiement sécurisé"].map((t) => (
                  <span key={t} style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 500 }}>✓ {t}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#d1d5db", fontWeight: 500, background: "#f3f4f6", padding: "3px 10px", borderRadius: 4 }}>
                Document généré automatiquement
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}