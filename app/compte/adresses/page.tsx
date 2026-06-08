"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Address = {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export default function AdressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Load addresses from user metadata on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const saved = user.user_metadata?.addresses;
      if (Array.isArray(saved)) setAddresses(saved);
    });
  }, []);

  const persistAddresses = async (next: Address[]) => {
    await supabase.auth.updateUser({ data: { addresses: next } });
  };

  const handleDelete = async (id: string) => {
    const next = addresses.filter(a => a.id !== id);
    // If deleted was default and others remain, make first one default
    if (addresses.find(a => a.id === id)?.isDefault && next.length > 0) {
      next[0].isDefault = true;
    }
    setAddresses(next);
    await persistAddresses(next);
  };

  const handleSetDefault = async (id: string) => {
    const next = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(next);
    await persistAddresses(next);
  };

  const startEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
    });
    setEditId(addr.id);
    setShowForm(true);
  };

  const [form, setForm] = useState({
    label: "",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    zip: "",
    country: "Maroc",
    phone: "",
  });

  const field = (id: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">{label}</label>
      <input
        type={type}
        value={form[id]}
        onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400 mb-1">Mon compte</p>
          <h1 className="font-black text-[26px] uppercase tracking-tight">Mes adresses</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditId(null); setForm({ label: "", fullName: "", line1: "", line2: "", city: "", zip: "", country: "Maroc", phone: "" }); setShowForm(true); }}
            className="flex items-center gap-2 bg-black text-white font-black text-[11px] uppercase tracking-widest px-5 py-3 hover:bg-neutral-800 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-neutral-100">
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-0.5">{editId ? "Modifier l'adresse" : "Nouvelle adresse"}</p>
              <h2 className="font-black text-[14px] uppercase tracking-wide">{editId ? "Modifier" : "Ajouter une adresse"}</h2>
            </div>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm({ label: "", fullName: "", line1: "", line2: "", city: "", zip: "", country: "Maroc", phone: "" }); }}
              className="text-neutral-400 hover:text-black transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!form.label || !form.fullName || !form.line1 || !form.city) return;
              setSaving(true);
              let next: Address[];
              if (editId) {
                next = addresses.map(a => a.id === editId ? { ...a, ...form } : a);
              } else {
                const newAddr: Address = { ...form, id: Date.now().toString(), isDefault: addresses.length === 0 };
                next = [...addresses, newAddr];
              }
              setAddresses(next);
              await persistAddresses(next);
              setSaving(false);
              setShowForm(false);
              setEditId(null);
              setForm({ label: "", fullName: "", line1: "", line2: "", city: "", zip: "", country: "Maroc", phone: "" });
            }}
            className="p-6 flex flex-col gap-5"
          >
            {field("label", "Libellé", "text", "ex: Domicile, Bureau…")}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("fullName", "Nom complet", "text", "Karim Alaoui")}
              {field("phone", "Téléphone", "tel", "+212 6XX XXX XXX")}
            </div>

            {field("line1", "Adresse ligne 1", "text", "12 rue des Roses, Apt 3")}
            {field("line2", "Adresse ligne 2 (optionnel)", "text", "Résidence Al Nour")}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {field("city", "Ville", "text", "Casablanca")}
              {field("zip", "Code postal", "text", "20000")}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Pays</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors bg-white"
                >
                  <option>Maroc</option>
                  <option>France</option>
                  <option>Belgique</option>
                  <option>Suisse</option>
                  <option>Canada</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); setForm({ label: "", fullName: "", line1: "", line2: "", city: "", zip: "", country: "Maroc", phone: "" }); }}
                className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors px-4 py-3 border border-neutral-200 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white font-black text-[11px] uppercase tracking-widest px-8 py-3.5 hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? "..." : editId ? "Mettre à jour" : "Enregistrer l'adresse"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address list or empty state */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white border border-neutral-100 px-8 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-2 border-dashed border-neutral-200 flex items-center justify-center mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-300 mb-2">
            Aucune adresse
          </p>
          <p className="text-[12px] text-neutral-400 max-w-[240px] leading-relaxed mb-8">
            Ajoutez une adresse de livraison pour accélérer vos futures commandes.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-black text-white font-black text-[11px] uppercase tracking-widest px-6 py-3.5 hover:bg-neutral-800 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Ajouter une adresse
          </button>
        </div>
      ) : (
        addresses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white border border-neutral-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-[12px] uppercase tracking-widest">{addr.label}</p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black px-2 py-0.5 mt-1 inline-block">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(addr)} className="text-neutral-400 hover:text-black transition-colors" title="Modifier">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="text-neutral-400 hover:text-red-500 transition-colors" title="Supprimer">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="text-[12px] text-neutral-600 leading-relaxed">
                  <p>{addr.fullName}</p>
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>{addr.zip} {addr.city}, {addr.country}</p>
                  {addr.phone && <p>{addr.phone}</p>}
                </div>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="self-start text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors border border-neutral-200 hover:border-black px-3 py-1.5">
                    Définir par défaut
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
