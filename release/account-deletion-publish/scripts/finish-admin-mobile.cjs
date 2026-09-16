const fs=require('node:fs');
function edit(file, fn) {
 let s=fs.readFileSync(file,'utf8').replace(/\r\n/g, '\n');
 const replace=(a,b)=>{if(!s.includes(a))throw Error(`Missing in ${file}: ${a.slice(0,70)}`); s=s.replace(a,b);};
 fn(replace,()=>s); fs.writeFileSync(file,s);
}
edit('app/admin/products/page.tsx',(r,s)=>{
 r('const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());','const matchSearch = !search || `${p.name} ${p.slug} ${p.brand ?? ""} ${p.id}`.toLowerCase().includes(search.toLowerCase());');
 r('return matchSearch && matchCat;','const matchStatus = statusFilter === "all" || (statusFilter === "active" && p.active) || (statusFilter === "inactive" && !p.active) || (statusFilter === "out" && p.stock === 0) || (statusFilter === "low" && p.stock > 0 && p.stock <= lowStockThreshold);\n    return matchSearch && matchCat && matchStatus && (!brandFilter || p.brand === brandFilter);');
 r('const activeProducts =', `filtered.sort((a, b) => sortBy === "price-up" ? a.price - b.price : sortBy === "price-down" ? b.price - a.price : sortBy === "stock" ? a.stock - b.stock : sortBy === "name" ? a.name.localeCompare(b.name, "fr") : 0);
  const pagination = useAdminPagination(filtered, JSON.stringify([search, filterCat, statusFilter, brandFilter, sortBy]));
  const resetFilters = () => { setSearch(""); setStatusFilter("all"); setBrandFilter(""); setSortBy("default"); router.replace("/admin/products"); };
  const activeProducts =`);
 r('<input type="text" placeholder="Rechercher…"','<input type="search" aria-label="Rechercher un produit" placeholder="Nom, marque, référence…"');
 r('<div className="flex snap-x gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] lg:pb-0 [&::-webkit-scrollbar]:hidden">','<FilterPanel onReset={resetFilters}><div className="flex flex-wrap gap-2">');
 r('{/* Scroll arrows for the table below */}',`<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <label className="text-xs font-semibold">Statut et stock<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="all">Tous</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="low">Stock faible</option><option value="out">Rupture</option></select></label>
  <label className="text-xs font-semibold">Marque<select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Toutes</option>{Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort().map(brand => <option key={brand} value={brand}>{brand}</option>)}</select></label>
  <label className="text-xs font-semibold">Trier par<select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="default">Ordre du catalogue</option><option value="name">Nom</option><option value="price-up">Prix croissant</option><option value="price-down">Prix décroissant</option><option value="stock">Stock croissant</option></select></label>
  </div></FilterPanel>{/* Scroll arrows for the table below */}`);
 r('(search || filterCat !== "all") && <button type="button" onClick={() => { setSearch(""); router.replace("/admin/products"); }}','(search || filterCat !== "all" || statusFilter !== "all" || brandFilter || sortBy !== "default") && <button type="button" onClick={resetFilters}');
 r('{filtered.map((p) => (','{pagination.items.map((p) => (');r('{filtered.map((p) => (','{pagination.items.map((p) => (');
 const pos=s().lastIndexOf('    </div>');
 r(s().slice(pos), '      {!loading && <Pagination {...pagination} />}\n'+s().slice(pos));
 r('className="flex items-center gap-2 border-t border-neutral-100 bg-neutral-50/70 p-2.5"','className="flex flex-wrap items-center gap-2 border-t border-neutral-100 bg-neutral-50/70 p-2.5"');
});
edit('app/admin/stock/page.tsx',(r)=>{
 r('"low" | "all"','"low" | "healthy" | "all"');
 r('stock <= threshold);','stock <= threshold)\n        || (product.active && filter === "healthy" && stock > threshold);');
 r('tone="green" active={false}', 'tone="green" active={filter === "healthy"} onClick={() => setFilter("healthy")}');
 r('{ id: "all", label: "Tous", count: products.length }','{ id: "healthy", label: "Stock sain", count: healthyCount }, { id: "all", label: "Tous", count: products.length }');
 r('className="flex gap-1 overflow-x-auto rounded-2xl','className="flex flex-wrap gap-1 rounded-2xl');
});
edit('app/admin/orders/page.tsx',(r,s)=>{
 r('import { preorderCopy }', 'import FilterPanel from "@/components/admin/FilterPanel";\nimport Pagination, { useAdminPagination } from "@/components/admin/Pagination";\nimport { preorderCopy }');
 r('  const filtered = orders.filter', '  const [paymentFilter, setPaymentFilter] = useState("all");\n  const [dateFrom, setDateFrom] = useState("");\n  const [dateTo, setDateTo] = useState("");\n  const filtered = orders.filter');
 r('return matchStatus && matchSource && matchSearch &&',`const isPaypal = (o.payment_method ?? "").toLowerCase().startsWith("paypal");
    const matchPayment = paymentFilter === "all" || (paymentFilter === "paypal" ? isPaypal : !isPaypal);
    const matchDate = (!dateFrom || new Date(o.created_at) >= new Date(dateFrom + "T00:00:00")) && (!dateTo || new Date(o.created_at) <= new Date(dateTo + "T23:59:59.999"));
    return matchStatus && matchSource && matchSearch && matchPayment && matchDate &&`);
 r('  return (\n    <div className="flex flex-col lg:flex-row', '  const pagination = useAdminPagination(filtered, JSON.stringify([search, filterStatus, filterSource, paymentFilter, dateFrom, dateTo, preordersOnly]));\n  return (\n    <div className="flex flex-col lg:flex-row');
 r('<input value={search}', '<input type="search" aria-label="Rechercher une commande" value={search}');
 r('<div className="flex gap-1.5 mb-4 flex-wrap">',`<FilterPanel title="Filtrer les commandes" onReset={() => { setFilterStatus("all"); setFilterSource("all"); setPaymentFilter("all"); setDateFrom(""); setDateTo(""); setPreordersOnly(false); }}>
        <div className="flex gap-1.5 mb-4 flex-wrap">`);
 r('        {loadError && (',`        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold">Paiement<select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="all">Tous</option><option value="paypal">PayPal</option><option value="cod">À la livraison</option></select></label>
          <label className="text-xs font-semibold">Du<input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className="mt-1 w-full rounded-xl border p-2" /></label>
          <label className="text-xs font-semibold">Au<input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className="mt-1 w-full rounded-xl border p-2" /></label>
        </div>
        </FilterPanel>
        <p role="status" className="my-3 text-xs text-neutral-500">{filtered.length} résultats</p>
        {loadError && (`);
 r('{filtered.map((o) => (','{pagination.items.map((o) => (');r('{filtered.map((o) => (','{pagination.items.map((o) => (');
 r('      {/* RIGHT: Detail panel */}', '      {!loading && !detail && <Pagination {...pagination} />}\n      {/* RIGHT: Detail panel */}');
 r('<Section title="Actions">','<div id="admin-order-actions" className="scroll-mt-24" /><Section title="Actions">');
 r('      {/* Review Request Modal */}',`      {detail && <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden"><div className="admin-order-contact">
        {detail.customer?.phone && <><a href={"tel:" + detail.customer.phone}>Appeler</a><a href={"https://wa.me/" + detail.customer.phone.replace(/[^+0-9]/g, "").replace(/^0/, "212").replace(/^\\+/, "")} target="_blank" rel="noreferrer">WhatsApp</a></>}
        <button type="button" className="admin-primary" onClick={() => document.getElementById("admin-order-actions")?.scrollIntoView({ block: "start", behavior: "smooth" })}>Statut</button>
      </div></div>}
      {/* Review Request Modal */}`);
 r('bg-neutral-50 pb-[max(2rem,env(safe-area-inset-bottom))]', 'bg-neutral-50 pb-[calc(6rem+env(safe-area-inset-bottom))]');
 r('fixed bottom-6 left-1/2', 'fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2');
});
