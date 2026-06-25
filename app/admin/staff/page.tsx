"use client";
import { useEffect, useState, useCallback } from "react";

interface Role {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface StaffMember {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role_id: string | null;
  status: "active" | "invited" | "suspended";
  invite_token: string | null;
  last_login: string | null;
  created_at: string;
  admin_roles: Role | null;
}

const STATUS_META = {
  active:    { label: "Actif",   color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  invited:   { label: "Invité",  color: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  suspended: { label: "Suspendu",color: "bg-red-100 text-red-600",      dot: "bg-red-500" },
};

function Avatar({ name, url, color }: { name: string; url?: string | null; color?: string }) {
  if (url) return <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover" />;
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
      style={{ background: color ?? "#6b7280" }}>
      {initials}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Invite form
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRoleId, setInvRoleId] = useState("");
  const [inviting, setInviting] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "invited" | "suspended">("active");
  const [editSaving, setEditSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, rRes] = await Promise.all([
      fetch("/api/admin/staff").catch(() => null),
      fetch("/api/admin/roles").catch(() => null),
    ]);
    if (sRes?.ok) setStaff(await sRes.json());
    if (rRes?.ok) setRoles(await rRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(text: string, type: "ok" | "err") {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  }

  async function invite() {
    if (!invName.trim() || !invEmail.trim()) return;
    setInviting(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: invName.trim(), email: invEmail.trim(), role_id: invRoleId || null }),
    });
    const data = await res.json();
    if (res.ok) {
      const origin = window.location.origin;
      setInviteLink(`${origin}/admin/accept-invite?token=${data.invite_token}`);
      setInvName(""); setInvEmail(""); setInvRoleId("");
      setShowInvite(false);
      await load();
      flash("Invitation créée avec succès ✓", "ok");
    } else {
      flash(data.error ?? "Erreur lors de l'invitation", "err");
    }
    setInviting(false);
  }

  async function saveEdit() {
    if (!editMember) return;
    setEditSaving(true);
    const res = await fetch(`/api/admin/staff/${editMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, role_id: editRoleId || null, status: editStatus }),
    });
    if (res.ok) {
      await load();
      setEditMember(null);
      flash("Membre mis à jour ✓", "ok");
    } else {
      const d = await res.json();
      flash(d.error ?? "Erreur", "err");
    }
    setEditSaving(false);
  }

  async function deleteMember() {
    if (!deleteConfirm) return;
    await fetch(`/api/admin/staff/${deleteConfirm.id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    await load();
    flash("Membre supprimé", "ok");
  }

  function openEdit(m: StaffMember) {
    setEditMember(m);
    setEditName(m.name);
    setEditRoleId(m.role_id ?? "");
    setEditStatus(m.status);
  }

  const filtered = staff.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchRole = !filterRole || m.role_id === filterRole;
    const matchStatus = !filterStatus || m.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === "active").length,
    invited: staff.filter(s => s.status === "invited").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Flash message */}
      {actionMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all ${
          actionMsg.type === "ok" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-neutral-900">Équipe & Accès</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Gérez les membres de votre équipe et leurs accès</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Inviter un membre
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total membres", value: stats.total, icon: "👥", bg: "bg-neutral-50" },
          { label: "Actifs",         value: stats.active,  icon: "✅", bg: "bg-green-50" },
          { label: "En attente",     value: stats.invited, icon: "⏳", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-neutral-100`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-2xl font-black text-neutral-900">{s.value}</p>
            <p className="text-xs text-neutral-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invite link banner */}
      {inviteLink && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="flex-shrink-0"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-700 mb-0.5">Lien d&apos;invitation généré</p>
            <p className="text-[11px] text-blue-500 font-mono truncate">{inviteLink}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(inviteLink); flash("Lien copié ✓", "ok"); }}
            className="flex-shrink-0 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors">
            Copier
          </button>
          <button onClick={() => setInviteLink(null)} className="text-blue-300 hover:text-blue-500 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un membre…"
            className="w-full pl-8 pr-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors bg-white">
          <option value="">Tous les rôles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors bg-white">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="invited">Invités</option>
          <option value="suspended">Suspendus</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-sm font-bold text-neutral-400">
              {staff.length === 0 ? "Aucun membre pour l'instant" : "Aucun résultat"}
            </p>
            {staff.length === 0 && (
              <button onClick={() => setShowInvite(true)}
                className="mt-4 text-sm font-bold text-black underline underline-offset-4">
                Inviter le premier membre →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-wide px-5 py-3">Membre</th>
                <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-wide px-5 py-3">Rôle</th>
                <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-wide px-5 py-3">Statut</th>
                <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-wide px-5 py-3">Dernière connexion</th>
                <th className="text-left text-[10px] font-black text-neutral-400 uppercase tracking-wide px-5 py-3">Ajouté le</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const meta = STATUS_META[m.status];
                const role = m.admin_roles;
                return (
                  <tr key={m.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} url={m.avatar_url} color={role?.color} />
                        <div>
                          <p className="text-sm font-bold text-neutral-900">{m.name}</p>
                          <p className="text-[11px] text-neutral-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {role ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl inline-flex"
                          style={{ background: role.color + "18", color: role.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: role.color }} />
                          {role.name}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-300 font-medium">— Aucun rôle</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl inline-flex ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-neutral-400">{formatDate(m.last_login)}</td>
                    <td className="px-5 py-3.5 text-[12px] text-neutral-400">{formatDate(m.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg text-neutral-300 hover:text-black hover:bg-neutral-100 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(m)}
                          className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black">Inviter un membre</h3>
              <button onClick={() => setShowInvite(false)} className="text-neutral-300 hover:text-neutral-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Nom complet *</label>
                <input autoFocus value={invName} onChange={e => setInvName(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                  placeholder="Ex: Ahmed Benali" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Email *</label>
                <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="ahmed@exemple.com" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Rôle assigné</label>
                <select value={invRoleId} onChange={e => setInvRoleId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                  <option value="">Aucun rôle (attribuer plus tard)</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-[11px] text-blue-600">
                <strong>Info :</strong> Un lien d&apos;invitation sera généré. Partagez-le avec le membre pour qu&apos;il puisse créer son compte.
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Annuler
                </button>
                <button onClick={invite} disabled={!invName.trim() || !invEmail.trim() || inviting}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
                  {inviting ? "Invitation…" : "Envoyer l'invitation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <Avatar name={editMember.name} url={editMember.avatar_url} color={editMember.admin_roles?.color} />
              <div className="flex-1">
                <h3 className="text-base font-black">{editMember.name}</h3>
                <p className="text-xs text-neutral-400">{editMember.email}</p>
              </div>
              <button onClick={() => setEditMember(null)} className="text-neutral-300 hover:text-neutral-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Nom</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Rôle</label>
                <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                  <option value="">Aucun rôle</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Statut</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["active", "invited", "suspended"] as const).map(s => {
                    const meta = STATUS_META[s];
                    return (
                      <button key={s} onClick={() => setEditStatus(s)}
                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          editStatus === s ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                        }`}>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditMember(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Annuler
                </button>
                <button onClick={saveEdit} disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50">
                  {editSaving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Avatar name={deleteConfirm.name} url={deleteConfirm.avatar_url} color={deleteConfirm.admin_roles?.color} />
            <h3 className="text-base font-black mt-3 mb-1">Supprimer {deleteConfirm.name} ?</h3>
            <p className="text-sm text-neutral-400 mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
                Annuler
              </button>
              <button onClick={deleteMember}
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
