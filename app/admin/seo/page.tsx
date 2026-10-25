"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { auditCatalogue, effectiveSeo, internalLinks, seoPath, seoSlug, type SeoContent, type SeoDocument } from "@/lib/seo-engine";
import styles from "./seo.module.css";
import SeoSyncControl from "./SeoSyncControl";
import SeoAiControl from "./SeoAiControl";
import EditorialWorkspace, { type EditorialEditingState } from "./EditorialWorkspace";

type Event = { id: number; action: string; actor: string; detail: string | null; content: SeoContent | null; created_at: string };
type SyncStatus = { reconciledAt: string | null; completedAt: string | null; pending: number; failed: number; errors: { kind: string; entity_id: string; state: string; attempts: number; last_error: string; available_at: string }[] };
type Data = { documents: SeoDocument[]; synchronization?: SyncStatus | null; canEditProducts: boolean; canEditCategories: boolean; aiConfigured: boolean };
const key = (doc: SeoDocument) => `${doc.kind}:${doc.entity_id}`;
const status = (doc: SeoDocument) => doc.draft ? "À approuver" : doc.published ? "Approuvé" : "Automatique";

export default function SeoDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const editorialEditing = useRef<EditorialEditingState>({dirty:false, busy:false});
  const trackEditorialEditing = useCallback((state: EditorialEditingState) => {editorialEditing.current = state;}, []);
  const [editorVersion, setEditorVersion] = useState<number | null>(null);
  const [form, setForm] = useState<SeoContent>({ title: "", description: "", imageAlt: "" });
  const [events, setEvents] = useState<Event[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [moreHistory, setMoreHistory] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: string[] } | null>(null);
  const stop = useRef(false);
  const historyRequest = useRef(0);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seo", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Connexion impossible. Réessayez."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { stop.current = true; }; }, [load]);
  const documents = data?.documents ?? [];
  const issues = useMemo(() => auditCatalogue(data?.documents ?? []), [data]);
  const filtered = documents.filter(doc => `${doc.source.name} ${doc.slug}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || filter === doc.kind || filter === "issues" && issues.get(key(doc))!.length > 0 || filter === "draft" && doc.draft || filter === "inactive" && !doc.active));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1));
  const visible = filtered.slice(currentPage * 20, currentPage * 20 + 20);
  const current = documents.find(doc => key(doc) === editing);
  const staleEditor = Boolean(current && current.version !== editorVersion);
  const canEdit = (doc: SeoDocument) => doc.kind === "product" ? data?.canEditProducts : data?.canEditCategories;
  async function history(doc: SeoDocument, before?: number) {
    const request = ++historyRequest.current;
    setHistoryLoading(true); setHistoryError("");
    try {
      const response = await fetch(`/api/admin/seo?kind=${doc.kind}&id=${encodeURIComponent(doc.entity_id)}${before ? `&before=${before}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (request === historyRequest.current) { setEvents(old => before ? [...old, ...result.events] : result.events); setMoreHistory(result.events.length === 30); }
    } catch { if (request === historyRequest.current) setHistoryError("Historique indisponible. Réessayez."); }
    finally { if (request === historyRequest.current) setHistoryLoading(false); }
  }
  function open(doc: SeoDocument) {
    if (key(doc) !== editing && !canLeaveEditorial()) return;
    setEditing(key(doc)); setEditorVersion(doc.version); setForm(doc.draft ?? effectiveSeo(doc)); setEvents([]); setMoreHistory(false); void history(doc);
  }
  function canLeaveEditorial() {
    if (editorialEditing.current.busy) {setMessage("Une opération éditoriale est en cours. Attendez son résultat avant de changer de fiche."); return false;}
    return !editorialEditing.current.dirty || editorialEditing.current.recovered || window.confirm("Quitter cette fiche et abandonner le texte éditorial non enregistré ? Annulez pour l’enregistrer d’abord.");
  }
  async function mutate(doc: SeoDocument, action: string, content?: SeoContent) {
    const response = await fetch("/api/admin/seo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: doc.kind, id: doc.entity_id, version: doc.version, action, content, useAI }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Modification impossible.");
    setData(old => old ? { ...old, documents: old.documents.map(item => key(item) === key(doc) ? result.document : item) } : old);
    return result as { document: SeoDocument; warning?: string };
  }
  async function action(doc: SeoDocument, name: string) {
    if (editorVersion === null || doc.version !== editorVersion) {
      setMessage("Cette fiche a changé. Rechargez la version actuelle dans l’éditeur avant de continuer.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const result = await mutate({ ...doc, version: editorVersion }, name, name === "draft" ? form : undefined);
      setEditorVersion(result.document.version);
      setForm(result.document.draft ?? effectiveSeo(result.document));
      setMessage(result.warning || (name === "approve" ? "Métadonnées approuvées et enregistrées." : "Modification enregistrée."));
      void history(result.document);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erreur réseau. Actualisez avant de réessayer."); }
    finally { setBusy(false); }
  }
  async function bulk() {
    const queue = documents.filter(doc => selected.includes(key(doc)) && canEdit(doc));
    setBusy(true); stop.current = false;
    const failed: string[] = [];
    let done = 0;
    setProgress({ done, total: queue.length, failed: [] });
    for (const doc of queue) {
      if (stop.current) break;
      try { const result = await mutate(doc, "generate"); if (result.warning) setMessage(result.warning); }
      catch (error) { failed.push(`${doc.source.name} : ${error instanceof Error ? error.message : "Erreur réseau"}`); }
      done++; setProgress({ done, total: queue.length, failed: [...failed] });
      // Keep requests below the existing process-local mutation rate limit.
      if (done < queue.length && !stop.current) await new Promise(resolve => setTimeout(resolve, 800));
    }
    setBusy(false); setSelected([]);
  }
  const dirty = current && JSON.stringify(form) !== JSON.stringify(current.draft ?? effectiveSeo(current));
  return <main className={styles.root}>
    <header className={styles.header}><div><p className={styles.eyebrow}>LECOMAX · VISIBILITÉ ORGANIQUE</p><h1>Atelier SEO</h1><p>Des fiches claires, des données fiables, une validation humaine.</p></div><button disabled={busy || loading} onClick={() => void load()}>Actualiser</button></header>
    {message && <div className={styles.notice} role="status">{message}</div>}
    {loading && <p role="status">Chargement du catalogue SEO…</p>}
    {data && <>
      <section className={styles.notice} aria-label="Synchronisation SEO">
        {data.canEditProducts && data.canEditCategories && <SeoSyncControl onComplete={load} />}
        <h2>Synchronisation en arrière-plan</h2>
        {data.synchronization ? <>
          <p>{data.synchronization.pending} en attente · {data.synchronization.failed} en échec</p>
          <p>Dernier contrôle du catalogue : {data.synchronization.reconciledAt ? new Date(data.synchronization.reconciledAt).toLocaleString("fr-FR") : "Jamais — démarrage du worker requis"}</p>
          {(!data.synchronization.reconciledAt || Date.now() - Date.parse(data.synchronization.reconciledAt) > 15 * 60_000) && <p role="alert">Synchronisation en retard. Vérifiez le processus planifié.</p>}
          <p>Dernière fiche synchronisée : {data.synchronization.completedAt ? new Date(data.synchronization.completedAt).toLocaleString("fr-FR") : "Aucune"}</p>
          {data.synchronization.errors.map(error => <p key={`${error.kind}:${error.entity_id}`} role="status">{error.kind} {error.entity_id} : {error.last_error} · tentative {error.attempts} · {error.state}{error.state === "retry" ? ` · nouvel essai après ${new Date(error.available_at).toLocaleString("fr-FR")}` : ""}</p>)}
        </> : <p role="alert">État de synchronisation indisponible. Vérifiez la migration et le worker.</p>}
        <p>Les nouvelles fiches apparaissent après le prochain passage du worker. Les erreurs SEO ne bloquent pas les commandes.</p>
      </section>
      {data.canEditProducts && data.canEditCategories && <SeoAiControl key={current ? key(current) : "overview"} document={current} onApproved={() => void load()} />}
      {current?.kind === "product" && <EditorialWorkspace key={key(current)} id={current.entity_id} onChanged={() => void load()} onEditingStateChange={trackEditorialEditing}/>}
      <section className={styles.stats} aria-label="Vue d’ensemble">
        {[ ["Fiches actives", documents.filter(d => d.active).length], ["Approuvées", documents.filter(d => d.published).length], ["Brouillons", documents.filter(d => d.draft).length], ["À examiner", documents.filter(d => issues.get(key(d))!.length > 0).length] ].map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </section>
      <div className={styles.notice}>Les métadonnées automatiques restent disponibles sans IA. Les suggestions sont enregistrées comme brouillons ; seule l’approbation les publie sur le site. L’aperçu ci-dessous est indicatif : Google peut réécrire les résultats.</div>
      <section className={styles.panel} aria-label="Catalogue SEO">
        <div className={styles.toolbar}><label>Rechercher<input value={search} placeholder="Nom ou URL…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
          <label>Afficher<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">Toutes les fiches</option><option value="product">Produits</option><option value="category">Catégories</option><option value="issues">À examiner</option><option value="draft">Brouillons</option><option value="inactive">Inactives</option></select></label>
          <label className={styles.check}><input type="checkbox" checked={useAI} disabled={busy || !data.aiConfigured} onChange={e => setUseAI(e.target.checked)} />IA optionnelle {data.aiConfigured ? "" : "(non configurée)"}</label>
        </div>
        <div className={styles.toolbar}><button disabled={busy || selected.length === 0} onClick={() => void bulk()}>Générer {selected.length || "les"} brouillons sélectionnés</button><span>Maximum 50 par lot. Aucune approbation en masse.</span>{busy && progress && <button onClick={() => { stop.current = true; }}>Arrêter après la fiche en cours</button>}</div>
        {progress && <div role="status"><progress value={progress.done} max={progress.total} /> {progress.done} / {progress.total} traitées · {progress.failed.length} erreurs{progress.failed.map(error => <p key={error} className={styles.error}>{error}</p>)}</div>}
        <div className={styles.list}>{visible.map(doc => <article key={key(doc)} className={styles.row}>
          <input aria-label={`Sélectionner ${doc.source.name}`} type="checkbox" disabled={busy || !canEdit(doc) || !selected.includes(key(doc)) && selected.length >= 50} checked={selected.includes(key(doc))} onChange={e => setSelected(old => e.target.checked ? [...old, key(doc)] : old.filter(id => id !== key(doc)))} />
          <div className={styles.rowName}><strong>{doc.source.name}</strong><small>{doc.kind === "product" ? "Produit" : "Catégorie"} · {doc.active ? "Active" : "Inactive"} · {doc.slug}</small></div>
          <span className={styles.badge}>{status(doc)}</span><span>{issues.get(key(doc))!.length} points à examiner</span><button disabled={busy} onClick={() => open(doc)}>Examiner</button>
        </article>)}</div>
        {!filtered.length && <p>Aucune fiche pour ces critères.</p>}
        <nav className={styles.toolbar} aria-label="Pagination du catalogue"><button disabled={currentPage === 0 || busy} onClick={() => setPage(currentPage - 1)}>Précédent</button><span>Page {currentPage + 1} / {Math.max(1, Math.ceil(filtered.length / 20))} · {filtered.length} fiches</span><button disabled={(currentPage + 1) * 20 >= filtered.length || busy} onClick={() => setPage(currentPage + 1)}>Suivant</button></nav>
      </section>
      {current && <section className={styles.editor} aria-label={`Édition SEO : ${current.source.name}`}>
        <div className={styles.panel}><h2>{current.source.name}</h2><p>Version {current.version} · {status(current)}</p>
          {staleEditor && <p role="alert">Cette fiche a changé depuis son ouverture. Votre texte est conservé ci-dessous. Copiez les modifications à garder avant de recharger. <button disabled={busy} onClick={() => open(current)}>Recharger la version actuelle</button></p>}
          <div className={styles.actions}><button disabled={busy || staleEditor || !canEdit(current)} onClick={() => void action(current, "generate")}>Proposer un brouillon</button><button disabled={busy} onClick={() => { if (!canLeaveEditorial()) return; setEditing(null); historyRequest.current++; }}>Fermer</button></div>
          <label>Titre SEO <small>{form.title.length}/140</small><input value={form.title} maxLength={140} disabled={busy || !canEdit(current)} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Méta-description <small>{form.description.length}/320</small><textarea value={form.description} maxLength={320} rows={4} disabled={busy || !canEdit(current)} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label>Texte alternatif de l’image<input value={form.imageAlt} maxLength={240} disabled={busy || !canEdit(current)} onChange={e => setForm({ ...form, imageAlt: e.target.value })} /></label>
          <div className={styles.actions}><button disabled={busy || staleEditor || !canEdit(current) || !form.title.trim() || !form.description.trim() || !form.imageAlt.trim()} onClick={() => void action(current, "draft")}>Enregistrer le brouillon</button><button className={styles.primary} disabled={busy || staleEditor || !canEdit(current) || !current.draft || Boolean(dirty)} onClick={() => void action(current, "approve")}>Approuver le brouillon enregistré</button></div>
          {dirty && <p>Enregistrez vos modifications avant de les approuver.</p>}
          {current.published && <button disabled={busy || staleEditor || !canEdit(current)} onClick={() => void action(current, "reset")}>Revenir aux métadonnées automatiques</button>}
          <h3>Vérifications</h3><ul>{issues.get(key(current))?.map(issue => <li key={issue}>{issue}</li>)}</ul>
          <h3>Source à vérifier</h3><p>{current.source.description || "Aucune description source."}</p>
        </div>
        <div className={styles.panel}><h2>Aperçu du brouillon</h2><div className={styles.preview}><small>lecomax.com{seoPath(current.kind, current.slug)}</small><h3>{form.title}</h3><p>{form.description}</p></div>
          <p>URL canonique : <Link href={seoPath(current.kind, current.slug)} target="_blank">ouvrir la page actuelle</Link></p>
          <p>Suggestion de slug : <code>{seoSlug(current.source.name)}</code>. L’URL actuelle est conservée pour préserver les liens existants.</p>
          <h3>Liens internes recommandés</h3><ul>{internalLinks(current, documents).map(link => <li key={link.path}><Link href={link.path} target="_blank">{link.name}</Link></li>)}</ul>
          <h3>Historique et erreurs de génération</h3>{historyError && <p role="alert">{historyError} <button onClick={() => void history(current)}>Réessayer</button></p>}{historyLoading && <p role="status">Chargement de l’historique…</p>}
          {!events.length && !historyLoading && !historyError && <p>Aucune intervention enregistrée.</p>}
          {events.map(event => <details key={event.id} className={styles.event}><summary>{({ draft: "Brouillon", approve: "Approbation", reset: "Retour automatique", error: "Erreur" } as Record<string,string>)[event.action] ?? event.action} · {new Date(event.created_at).toLocaleString("fr-FR")}</summary><p>{event.actor}</p>{event.detail && <p className={styles.error}>{event.detail}</p>}{event.content && <><p>{event.content.title}</p><p>{event.content.description}</p><button disabled={busy || !canEdit(current)} onClick={() => setForm(event.content!)}>Reprendre ce contenu dans l’éditeur</button></>}</details>)}
          {moreHistory && <button disabled={historyLoading} onClick={() => void history(current, events.at(-1)?.id)}>Historique précédent</button>}
        </div>
      </section>}
    </>}
  </main>;
}
