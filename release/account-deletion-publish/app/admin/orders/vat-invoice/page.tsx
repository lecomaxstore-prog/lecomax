"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/supabase";

export default function VatInvoicePage() {
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
      setTimeout(() => window.print(), 400);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#999" }}>Commande introuvable.</div>;
  }

  // Calculations
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = Math.max(0, order.total - itemsTotal);
  const orderTotal = order.total;
  const vatRate = 0.20;
  const totalHT = orderTotal / (1 + vatRate);
  const totalVAT = orderTotal - totalHT;
  const invoiceDate = new Date(order.created_at);
  const invoiceNumber = `INV-${order.order_number}`;

  const fmt = (n: number) => `MAD ${n.toFixed(2)}`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 6px 10px; }
        .section-header { background: #c0c0c0; font-weight: bold; font-size: 11px; padding: 5px 10px; }
        .row-label { font-weight: bold; width: 160px; }
        .outer-border { border: 1px solid #999; }
        .cell-border { border: 1px solid #bbb; }
        .th-style { background: #c0c0c0; font-weight: bold; font-size: 11px; text-align: left; border: 1px solid #999; }
        .td-style { border: 1px solid #bbb; font-size: 12px; }
      `}</style>

      {/* Toolbar - hidden on print */}
      <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#111", color: "#fff", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000 }}>
        <span style={{ fontWeight: "bold" }}>Facture TVA — Commande #{order.order_number}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ padding: "6px 16px", background: "#fff", color: "#000", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
            Télécharger / Imprimer
          </button>
          <button onClick={() => window.close()} style={{ padding: "6px 16px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            Fermer
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "70px 20px 40px" }} className="no-print:pt-16">

        {/* Title */}
        <table className="outer-border" style={{ marginBottom: 0 }}>
          <tbody>
            <tr>
              <td className="section-header" style={{ fontSize: 13, letterSpacing: 1 }}>INVOICE</td>
            </tr>
          </tbody>
        </table>

        {/* Company Details */}
        <table className="outer-border" style={{ marginTop: 0, borderTop: "none" }}>
          <tbody>
            <tr><td className="section-header" colSpan={2}>Company Details</td></tr>
            <tr>
              <td className="row-label cell-border">Address:</td>
              <td className="cell-border">
                L&apos;ECOMAX<br />
                Casablanca, Maroc
              </td>
            </tr>
            <tr>
              <td className="row-label cell-border">Help Centre:</td>
              <td className="cell-border">contact@lecomax.com</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Company Reg. No.:</td>
              <td className="cell-border">—</td>
            </tr>
            <tr>
              <td className="row-label cell-border">VAT Reg. No.</td>
              <td className="cell-border">—</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Invoice No.:</td>
              <td className="cell-border">{invoiceNumber}</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Date/Tax Point:</td>
              <td className="cell-border">{invoiceDate.toISOString().slice(0, 10)}</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Ref Order Id:</td>
              <td className="cell-border">{order.order_number}</td>
            </tr>
          </tbody>
        </table>

        {/* Customer Details */}
        <table className="outer-border" style={{ marginTop: 0, borderTop: "none" }}>
          <tbody>
            <tr><td className="section-header" colSpan={2}>Customer Details</td></tr>
            <tr>
              <td className="row-label cell-border">Email:</td>
              <td className="cell-border">{order.customer?.email || "—"}</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Name:</td>
              <td className="cell-border">{order.customer?.name || "—"}</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Order ID:</td>
              <td className="cell-border">{order.order_number}</td>
            </tr>
            <tr>
              <td className="row-label cell-border">Payment Method:</td>
              <td className="cell-border">{order.payment_method || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Billing + Shipping Address */}
        <table className="outer-border" style={{ marginTop: 0, borderTop: "none" }}>
          <tbody>
            <tr>
              <td className="section-header" style={{ width: "50%" }}>Billing Address</td>
              <td className="section-header" style={{ width: "50%" }}>Customer Shipping Address</td>
            </tr>
            <tr>
              <td className="cell-border" style={{ verticalAlign: "top", width: "50%" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td className="row-label" style={{ whiteSpace: "nowrap" }}>Address</td>
                      <td>{order.customer?.address || "—"}</td>
                    </tr>
                    <tr>
                      <td className="row-label">City</td>
                      <td>{order.customer?.city || "—"}</td>
                    </tr>
                    <tr>
                      <td className="row-label">Country</td>
                      <td>Maroc</td>
                    </tr>
                    <tr>
                      <td className="row-label">Phone</td>
                      <td>{order.customer?.phone || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="cell-border" style={{ verticalAlign: "top", width: "50%" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td className="row-label" style={{ whiteSpace: "nowrap" }}>Address</td>
                      <td>{order.customer?.address || "—"}</td>
                    </tr>
                    <tr>
                      <td className="row-label">City</td>
                      <td>{order.customer?.city || "—"}</td>
                    </tr>
                    <tr>
                      <td className="row-label">Country</td>
                      <td>Maroc</td>
                    </tr>
                    <tr>
                      <td className="row-label">Phone</td>
                      <td>{order.customer?.phone || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Products table */}
        <table className="outer-border" style={{ marginTop: 0, borderTop: "none" }}>
          <thead>
            <tr>
              <th className="th-style" style={{ width: "38%" }}>Product</th>
              <th className="th-style" style={{ width: "20%" }}>SKU</th>
              <th className="th-style" style={{ width: "12%" }}>Quantity</th>
              <th className="th-style" style={{ width: "15%" }}>Price/Unit</th>
              <th className="th-style" style={{ width: "15%" }}>SubTotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="td-style">
                  {item.name}
                  {item.size ? <span style={{ color: "#666" }}> — {item.size}</span> : null}
                  {item.color ? <span style={{ color: "#666" }}> / {item.color}</span> : null}
                </td>
                <td className="td-style" style={{ color: "#555" }}>{item.id || "—"}</td>
                <td className="td-style" style={{ textAlign: "center" }}>{item.qty}</td>
                <td className="td-style" style={{ textAlign: "right" }}>MAD {item.price.toFixed(2)}</td>
                <td className="td-style" style={{ textAlign: "right" }}>MAD {(item.price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <table className="outer-border" style={{ marginTop: 0, borderTop: "none" }}>
          <tbody>
            <tr>
              <td style={{ width: "55%" }} />
              <td className="cell-border" style={{ textAlign: "right", whiteSpace: "nowrap" }}>ItemsTotal</td>
              <td className="cell-border" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmt(itemsTotal)}</td>
            </tr>
            <tr>
              <td />
              <td className="cell-border" style={{ textAlign: "right" }}>Delivery</td>
              <td className="cell-border" style={{ textAlign: "right" }}>{fmt(delivery)}</td>
            </tr>
            <tr>
              <td />
              <td className="cell-border" style={{ textAlign: "right", fontWeight: "bold" }}>Order Total</td>
              <td className="cell-border" style={{ textAlign: "right", fontWeight: "bold" }}>{fmt(orderTotal)}</td>
            </tr>
            <tr>
              <td />
              <td className="cell-border" style={{ textAlign: "right" }}>Total subject to 20% VAT</td>
              <td className="cell-border" style={{ textAlign: "right" }}>{fmt(totalHT)}</td>
            </tr>
            <tr>
              <td />
              <td className="cell-border" style={{ textAlign: "right" }}>Total VAT</td>
              <td className="cell-border" style={{ textAlign: "right" }}>{fmt(totalVAT)}</td>
            </tr>
            <tr>
              <td />
              <td className="cell-border" style={{ textAlign: "right", fontWeight: "bold", background: "#e8e8e8" }}>Total Invoice Amount</td>
              <td className="cell-border" style={{ textAlign: "right", fontWeight: "bold", background: "#e8e8e8" }}>{fmt(orderTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer note */}
        <p style={{ marginTop: 16, fontSize: 10, color: "#777", textAlign: "center" }}>
          Cette facture est générée automatiquement par L&apos;ECOMAX — contact@lecomax.com
        </p>
      </div>
    </>
  );
}
