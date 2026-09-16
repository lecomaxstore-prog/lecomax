"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/supabase";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function PrintOrderPage() {
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
      setTimeout(() => window.print(), 300);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="flex items-center justify-center min-h-screen text-neutral-400">Commande introuvable.</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #000; }
      `}</style>

      {/* Print toolbar - hidden on print */}
      <div className="no-print fixed top-0 inset-x-0 bg-neutral-900 text-white px-6 py-3 flex items-center justify-between z-50">
        <span className="font-bold">Aperçu avant impression — Commande #{order.order_number}</span>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-1.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-neutral-100">
            Imprimer
          </button>
          <button onClick={() => window.close()} className="px-4 py-1.5 border border-white/20 text-sm rounded-lg hover:bg-white/10">
            Fermer
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-2xl mx-auto px-8 py-16 no-print:pt-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="font-black text-2xl tracking-tight">L&apos;ECOMAX</p>
            <p className="text-neutral-500 text-xs mt-1">contact@lecomax.com</p>
          </div>
          <div className="text-right">
            <p className="font-black text-lg">Bon de commande</p>
            <p className="text-neutral-500 text-xs mt-1">#{order.order_number}</p>
            <p className="text-neutral-500 text-xs">{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="h-px bg-black mb-8" />

        {/* Customer & shipping */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Client</p>
            <p className="font-bold">{order.customer?.name}</p>
            <p className="text-neutral-600">{order.customer?.phone}</p>
            {order.customer?.email && <p className="text-neutral-600">{order.customer.email}</p>}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Adresse de livraison</p>
            <p className="text-neutral-700">{order.customer?.address}</p>
            <p className="text-neutral-700">{order.customer?.city}</p>
          </div>
        </div>

        {/* Status & tracking */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Statut</p>
            <p className="font-bold">{STATUS_LABELS[order.status] ?? order.status}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Mode de paiement</p>
            <p className="font-bold">{order.payment_method}</p>
          </div>
          {order.tracking_number && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">N° de suivi</p>
              <p className="font-bold font-mono">{order.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Articles</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-[10px] uppercase tracking-wide text-left">
                <th className="py-2 font-black">Produit</th>
                <th className="py-2 font-black text-center">Qté</th>
                <th className="py-2 font-black text-right">P.U.</th>
                <th className="py-2 font-black text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="py-2.5">
                    <p className="font-semibold">{item.name}</p>
                    {(item.size || item.color) && (
                      <p className="text-neutral-400 text-xs">
                        {[item.size && `Taille: ${item.size}`, item.color && `Couleur: ${item.color}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 text-center">{item.qty}</td>
                  <td className="py-2.5 text-right">{item.price.toFixed(2)} MAD</td>
                  <td className="py-2.5 text-right font-semibold">{(item.price * item.qty).toFixed(2)} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-4 border-t-2 border-black flex justify-between items-center">
            <span className="text-neutral-500 text-sm">Total TTC</span>
            <span className="font-black text-xl">{order.total} MAD</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8 p-4 border border-neutral-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Notes de commande</p>
            <p className="text-sm text-neutral-600">{order.notes}</p>
          </div>
        )}

        <div className="h-px bg-neutral-200 mt-12 mb-4" />
        <p className="text-center text-xs text-neutral-400">
          L&apos;ECOMAX · Merci pour votre commande !
        </p>
      </div>
    </>
  );
}
