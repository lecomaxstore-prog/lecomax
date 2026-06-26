"use client";
import { useEffect, useState, useCallback } from "react";

type Member = {
  id: string;
  email: string;
  points: number;
  updated_at: string;
};

const TIERS = [
  { name: "Gold",   min: 1000, color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "🥇" },
  { name: "Silver", min: 500,  color: "text-neutral-500", bg: "bg-neutral-100", border: "border-neutral-200", icon: "🥈" },
  { name: "Bronze", min: 0,    color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: "🥉" },
];

function getTier(pts: number) {
  return TIERS.find((t) => pts >= t.min) ?? TIERS[TIERS.length - 1];
}

export default function LoyaltyPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function adjustPoints(email: string) {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount)) return;
    setAdjusting(true);
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount }),
    });
    if (res.ok) {
      showToast(`${amount > 0 ? "+" : ""}${amount} points appliqués ✓`);
      setAdjustId(null);
      setAdjustAmount("");
      await load();
    } else {
      showToast("Erreur", false);
    }
    setAdjusting(false);
  }

  const filtered = members.filter((m) =>
    !search || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPts = members.reduce((s, m) => s + m.points, 0);
  const goldCount = members.filter((m) => m.points >= 1000).length;
  const silverCount = members.filter((m) => m.points >= 500 && m.points < 1000).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">🏆 Programme de fidélité</h1>
        <p className="text-neutral-500 text-xs mt-0.5">50 points par commande livrée · Bronze → Silver (500) → Gold (1000)</p>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${toast.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Membres", value: members.length, icon: "👥" },
          { label: "Gold 🥇", value: goldCount, icon: "" },
          { label: "Silver 🥈", value: silverCount, icon: "" },
          { label: "Points distribués", value: totalPts.toLocaleString("fr-FR"), icon: "" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-100 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par email…"
          className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black" />
      </div>

      {/* Members list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm bg-white rounded-2xl border border-neutral-100">
          {members.length === 0
            ? "Aucun membre EcoClub pour l'instant. Les points s'accumulent automatiquement à chaque livraison."
            : "Aucun résultat."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[460px]">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Membre</th>
                <th className="text-center px-3 py-3">Tier</th>
                <th className="text-center px-3 py-3">Points</th>
                <th className="text-center px-3 py-3">Prochain palier</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((m) => {
                const tier = getTier(m.points);
                const nextTier = TIERS.find((t) => t.min > m.points);
                const ptsToNext = nextTier ? nextTier.min - m.points : 0;
                const progress = nextTier ? Math.min(100, ((m.points - (TIERS[TIERS.indexOf(tier) + 1]?.min ?? 0)) / (nextTier.min - (TIERS[TIERS.indexOf(tier) + 1]?.min ?? 0))) * 100) : 100;
                return (
                  <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-neutral-900 truncate max-w-[200px]">{m.email}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Mis à jour {new Date(m.updated_at).toLocaleDateString("fr-FR")}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tier.color} ${tier.bg} ${tier.border}`}>
                        {tier.icon} {tier.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-neutral-900">{m.points.toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-3">
                      {nextTier ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] text-neutral-500">
                            <span>{nextTier.icon} {nextTier.name}</span>
                            <span>{ptsToNext} pts restants</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-500">Niveau max 🏆</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {adjustId === m.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder="ex: 50 ou -50"
                            className="w-24 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black"
                            autoFocus
                          />
                          <button onClick={() => adjustPoints(m.email)} disabled={adjusting}
                            className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50">
                            OK
                          </button>
                          <button onClick={() => { setAdjustId(null); setAdjustAmount(""); }}
                            className="px-2 py-1.5 text-xs text-neutral-400 hover:text-black">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setAdjustId(m.id)}
                          className="text-xs font-semibold text-neutral-500 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-neutral-400 transition-colors">
                          ± Ajuster pts
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
