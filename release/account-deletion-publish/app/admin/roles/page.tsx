"use client";
import { useEffect, useState, useCallback } from "react";
import { PERMISSION_CATEGORIES, ALL_PERMISSION_SLUGS } from "@/lib/permissions";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_system: boolean;
  permissions: string[];
  staff_count: number;
  created_at: string;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Editor state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const [editPerms, setEditPerms] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  // Create form
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState("#6366f1");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/roles").catch(() => null);
    if (res?.ok) setRoles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectRole(r: Role) {
    setSelected(r);
    setEditName(r.name);
    setEditDesc(r.description ?? "");
    setEditColor(r.color);
    setEditPerms(new Set(r.permissions));
    setDirty(false);
  }

  function togglePerm(slug: string) {
    setEditPerms(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setDirty(true);
  }

  function toggleCategory(slugs: string[]) {
    const allOn = slugs.every(s => editPerms.has(s));
    setEditPerms(prev => {
      const next = new Set(prev);
      slugs.forEach(s => allOn ? next.delete(s) : next.add(s));
      return next;
    });
    setDirty(true);
  }

  function toggleAll() {
    const isAll = ALL_PERMISSION_SLUGS.every(s => editPerms.has(s));
    setEditPerms(new Set(isAll ? [] : ALL_PERMISSION_SLUGS));
    setDirty(true);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/admin/roles/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDesc,
        color: editColor,
        permissions: Array.from(editPerms),
      }),
    });
    await load();
    // Re-select with updated data
    setSaving(false);
    setDirty(false);
  }

  async function createRole() {
    if (!createName.trim()) return;
    setCreating(true);
    await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, description: createDesc, color: createColor }),
    });
    setCreateName(""); setCreateDesc(""); setCreateColor("#6366f1");
    setShowCreate(false);
    setCreating(false);
    await load();
  }

  async function deleteRole(id: string) {
    await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
    await load();
  }

  const permCount = editPerms.has("*") ? ALL_PERMISSION_SLUGS.length : editPerms.size;
  const isSuper = selected?.permissions.includes("*");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-neutral-900">Rôles & Permissions</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Définissez qui peut faire quoi sur votre panel admin</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Nouveau rôle
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Roles list */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))
          ) : roles.map(r => (
            <button
              key={r.id}
              onClick={() => selectRole(r)}
              className={`w-full text-left bg-white rounded-2xl p-4 border-2 transition-all hover:shadow-md ${
                selected?.id === r.id ? "border-black shadow-md" : "border-transparent hover:border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: r.color + "22" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-neutral-900 truncate">{r.name}</span>
                    {r.is_system && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 uppercase tracking-wide flex-shrink-0">SYS</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-neutral-400">
                      {r.permissions.includes("*") ? "Toutes les permissions" : `${r.permissions.length} permission${r.permissions.length !== 1 ? "s" : ""}`}
                    </span>
                    <span className="text-neutral-200">·</span>
                    <span className="text-[11px] text-neutral-400">{r.staff_count} membre{r.staff_count !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          ))}
        </div>

        {/* Role editor */}
        {selected ? (
          <div className="flex-1 bg-white rounded-3xl border border-neutral-100 overflow-hidden">
            {/* Editor header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: editColor + "22" }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: editColor }} />
                </div>
                <div>
                  <h2 className="font-black text-[15px] text-neutral-900">{selected.name}</h2>
                  <p className="text-[11px] text-neutral-400">{selected.staff_count} membre{selected.staff_count !== 1 ? "s" : ""} assigné{selected.staff_count !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selected.is_system && (
                  <button
                    onClick={() => setDeleteConfirm(selected.id)}
                    className="p-2 rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={!dirty || saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    dirty ? "bg-black text-white hover:bg-neutral-800" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {saving ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  )}
                  Enregistrer
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic info */}
              {!selected.is_system && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Nom du rôle</label>
                    <input
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setDirty(true); }}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                      placeholder="Ex: Responsable Marketing"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Description</label>
                    <input
                      value={editDesc}
                      onChange={e => { setEditDesc(e.target.value); setDirty(true); }}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="Rôle et responsabilités..."
                    />
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-2">Couleur du badge</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { setEditColor(c); setDirty(true); }}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editColor === c ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                  <div className="relative ml-1">
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden">
                      <input type="color" value={editColor}
                        onChange={e => { setEditColor(e.target.value); setDirty(true); }}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                      <div className="w-4 h-4 rounded-full" style={{ background: editColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Permissions ({permCount}/{ALL_PERMISSION_SLUGS.length})</label>
                  {!isSuper && (
                    <button
                      onClick={toggleAll}
                      className="text-[11px] font-bold text-neutral-400 hover:text-black transition-colors"
                    >
                      {ALL_PERMISSION_SLUGS.every(s => editPerms.has(s)) ? "Tout décocher" : "Tout cocher"}
                    </button>
                  )}
                </div>

                {isSuper ? (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-700">Accès total</p>
                      <p className="text-[12px] text-red-400">Le Super Admin a accès à toutes les fonctionnalités sans restriction.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {PERMISSION_CATEGORIES.map(cat => {
                      const slugs = cat.permissions.map(p => p.slug);
                      const checkedCount = slugs.filter(s => editPerms.has(s)).length;
                      const allChecked = checkedCount === slugs.length;
                      const someChecked = checkedCount > 0 && !allChecked;

                      return (
                        <div key={cat.id} className="border border-neutral-100 rounded-2xl overflow-hidden">
                          {/* Category header */}
                          <button
                            onClick={() => toggleCategory(slugs)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                          >
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: cat.color + "22" }}>
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                            </div>
                            <span className="font-bold text-[13px] text-neutral-700 flex-1">{cat.label}</span>
                            <span className="text-[11px] text-neutral-400">{checkedCount}/{slugs.length}</span>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              allChecked ? "bg-black border-black" : someChecked ? "bg-neutral-300 border-neutral-300" : "border-neutral-300"
                            }`}>
                              {(allChecked || someChecked) && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  {allChecked ? <path d="M20 6L9 17l-5-5"/> : <path d="M5 12h14"/>}
                                </svg>
                              )}
                            </div>
                          </button>
                          {/* Permission items */}
                          <div className="grid grid-cols-2 gap-px bg-neutral-100">
                            {cat.permissions.map(perm => {
                              const checked = editPerms.has(perm.slug);
                              return (
                                <button
                                  key={perm.slug}
                                  onClick={() => togglePerm(perm.slug)}
                                  className={`flex items-center gap-2.5 px-4 py-2.5 bg-white text-left transition-colors hover:bg-neutral-50`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    checked ? "bg-black border-black" : "border-neutral-300"
                                  }`}>
                                    {checked && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>}
                                  </div>
                                  <span className="text-[12px] text-neutral-600 font-medium">{perm.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[400px] bg-white rounded-3xl border border-neutral-100">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-neutral-400">Sélectionnez un rôle</p>
              <p className="text-xs text-neutral-300 mt-1">Cliquez sur un rôle pour modifier ses permissions</p>
            </div>
          </div>
        )}
      </div>

      {/* Create role modal */}
      {showCreate && (
        <div className="admin-dialog-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black">Créer un rôle</h3>
              <button onClick={() => setShowCreate(false)} className="text-neutral-300 hover:text-neutral-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Nom du rôle *</label>
                <input
                  autoFocus
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createRole()}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                  placeholder="Ex: Responsable Marketing"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Description</label>
                <input
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Rôle et responsabilités..."
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-2">Couleur</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setCreateColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${createColor === c ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Annuler
                </button>
                <button onClick={createRole} disabled={!createName.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
                  {creating ? "Création…" : "Créer le rôle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="admin-dialog-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <h3 className="text-base font-black mb-2">Supprimer ce rôle ?</h3>
            <p className="text-sm text-neutral-400 mb-5">Les membres assignés à ce rôle n&apos;auront plus de rôle défini.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
                Annuler
              </button>
              <button onClick={() => deleteRole(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
