"use client";
import ResponsiveTable from "@/components/admin/ResponsiveTable";
import { useCallback, useEffect, useState } from "react";
import Pagination, { useAdminPagination } from "@/components/admin/Pagination";
import AdminLoading from "@/components/admin/AdminLoading";

type CustomerRow = {
  name: string;
  phone: string;
  email: string;
  city: string;
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
};

const WA_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.527 5.862L.057 23.885l6.162-1.616A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.359-.213-3.72.976.993-3.628-.234-.373A9.818 9.818 0 1112 21.818z" />
  </svg>
);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState<"totalSpent" | "orderCount" | "lastOrder">("totalSpent");

  const load = useCallback(async () => {
      setLoading(true);
      setError(false);
      try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("invalid response");

      const map = new Map<string, CustomerRow>();
      for (const o of data as { customer: { name: string; phone: string; email: string; city: string }; total: number; status: string; created_at: string }[]) {
        const key = o.customer?.phone || o.customer?.email || Math.random().toString();
        if (!map.has(key)) {
          map.set(key, {
            name: o.customer?.name ?? "—",
            phone: o.customer?.phone ?? "—",
            email: o.customer?.email ?? "",
            city: o.customer?.city ?? "—",
            totalSpent: 0,
            orderCount: 0,
            lastOrder: o.created_at,
          });
        }
        const c = map.get(key)!;
        if (o.status !== "cancelled") c.totalSpent += o.total;
        c.orderCount++;
        if (o.created_at > c.lastOrder) c.lastOrder = o.created_at;
      }

      setCustomers([...map.values()]);
      } catch { setError(true); }
      finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === "lastOrder") return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime();
    return b[sortBy] - a[sortBy];
  });

  const filtered = sorted.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const pagination = useAdminPagination(filtered, `${search}:${sortBy}`);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Clients</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {customers.length} client{customers.length !== 1 ? "s" : ""} · {totalRevenue.toFixed(0)} MAD total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 min-[390px]:grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Clients uniques", value: customers.length },
          { label: "Revenu total", value: `${totalRevenue.toFixed(0)} MAD` },
          { label: "Commandes / client", value: customers.length ? (customers.reduce((s, c) => s + c.orderCount, 0) / customers.length).toFixed(1) : "0" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 px-5 py-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="search" aria-label="Rechercher un client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, ville, email…"
            className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["totalSpent", "orderCount", "lastOrder"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                sortBy === s ? "bg-black text-white border-black" : "border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
              }`}
            >
              {s === "totalSpent" ? "Total dépensé" : s === "orderCount" ? "Commandes" : "Récent"}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">Impossible de charger les clients. <button type="button" onClick={() => void load()} className="font-bold underline">Réessayer</button></div>}
      {loading ? (
        <AdminLoading />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-neutral-400 text-sm">Aucun client trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
            <ResponsiveTable className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-neutral-100 text-xs text-neutral-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Ville</th>
                  <th className="text-right px-4 py-3">Total dépensé</th>
                  <th className="text-center px-4 py-3">Commandes</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">Dernier achat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {pagination.items.map((c, i) => {
                  const phone = c.phone.replace(/\s+/g, "");
                  const waPhone = phone.startsWith("0") ? "212" + phone.slice(1) : phone;
                  return (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-neutral-400 text-xs">{c.phone}</p>
                        {c.email && <p className="text-neutral-400 text-xs">{c.email}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-neutral-600 text-xs">{c.city}</td>
                      <td className="px-4 py-3 text-right font-bold">{c.totalSpent.toFixed(0)} MAD</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold bg-neutral-100 px-2 py-1 rounded-full">{c.orderCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 text-xs hidden lg:table-cell">
                        {new Date(c.lastOrder).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.phone && c.phone !== "—" && (
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            {WA_ICON}
                            Contacter
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ResponsiveTable>
            </div>
          )}
        </div>
      )}
      {!loading && <Pagination {...pagination} />}
    </div>
  );
}
