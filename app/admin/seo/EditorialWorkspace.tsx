"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { blankEditorial, editorialDraftKey, parseLocalEditorialDraft, type EditorialContent, type EditorialState } from "@/lib/seo-editorial";
import { assessEditorial } from "@/operations/seo-vercel/lib/seo-editorial-quality.mjs";
import styles from "./seo.module.css";

type Suggestion = {id: string; tier: string; content?: EditorialContent};
type State = EditorialState & {draftScope?: string; canEdit: boolean; suggestions?: Suggestion[]; suggestionsUnavailable?: boolean};
export type EditorialEditingState = {dirty: boolean; busy: boolean; recovered?: boolean};
export default function EditorialWorkspace({id, onChanged, onEditingStateChange}: {id: string; onChanged: () => void; onEditingStateChange?: (state: EditorialEditingState) => void}) {
  const [base, setBase] = useState<State | null>(null), [remote, setRemote] = useState<State | null>(null);
  const [form, setForm] = useState<EditorialContent>(blankEditorial), [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({facts:false, french:false, arabic:false, duplicates:false});
  const [jobs, setJobs] = useState<Suggestion[]>([]);
  const sequence = useRef(0), inFlight = useRef(false);
  const [notesDirty, setNotesDirty] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  function remember(content: EditorialContent, nextNotes = notes, nextBase = base) {
    try {
      if (!nextBase?.draftScope) throw Error("Missing account scope");
      const value = JSON.stringify({content, notes:nextNotes, base:{version:nextBase.version, revision:nextBase.revision, source:nextBase.source}});
      if (!parseLocalEditorialDraft(value)) throw Error("Draft too large");
      window.sessionStorage.setItem(editorialDraftKey(nextBase.draftScope, id), value);
      setRecovered(true); setRecoveryError("");
    } catch {setRecovered(false); setRecoveryError("Copie locale indisponible. Enregistrez une révision avant de quitter cette fiche.");}
  }
  function forget() {
    try {if (base?.draftScope) window.sessionStorage.removeItem(editorialDraftKey(base.draftScope, id)); setRecoveryError("");}
    catch {setRecoveryError("La copie locale n’a pas pu être effacée ; elle peut réapparaître au prochain chargement.");}
    setRecovered(false); setNotesDirty(false);
  }
  const fetchState = useCallback(async (query = "") => {
    const response = await fetch(`/api/admin/seo/editorial?id=${encodeURIComponent(id)}${query}`, {cache:"no-store"});
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "Lecture indisponible.");
    return result as State;
  }, [id]);
  useEffect(() => {
    const requests = sequence, token = ++requests.current;
    void fetchState().then(result => {
      if (requests.current !== token) return;
      setBase(result); setForm(result.head?.content ?? blankEditorial());
      if (result.canEdit && result.draftScope) {
        try {
          const raw = window.sessionStorage.getItem(editorialDraftKey(result.draftScope, id));
          const saved = parseLocalEditorialDraft(raw);
          if (saved) {
            setBase({...result, ...saved.base}); setForm(saved.content); setNotes(saved.notes); setDirty(true); setRecovered(true);
            if (saved.base.version !== result.version || saved.base.revision !== result.revision || JSON.stringify(saved.base.source) !== JSON.stringify(result.source)) setRemote(result);
          } else if (raw) setRecoveryError("Copie locale illisible ; elle est conservée dans cet onglet.");
        } catch {setRecoveryError("Stockage local indisponible. Enregistrez une révision avant de quitter.");}
      }
      setJobs(result.suggestions ?? []);
      if (result.suggestionsUnavailable) setError("Suggestions IA indisponibles ; la rédaction manuelle reste disponible.");
    }).catch(e => {if (requests.current === token) setError(e.message);});
    return () => {requests.current++;};
  }, [fetchState, id]);
  useEffect(() => {
    onEditingStateChange?.({dirty:dirty || notesDirty, busy, recovered});
    return () => onEditingStateChange?.({dirty:false, busy:false});
  }, [dirty, notesDirty, busy, recovered, onEditingStateChange]);
  useEffect(() => {
    if (!dirty && !notesDirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {event.preventDefault(); event.returnValue = "";};
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.origin === window.location.origin) return;
      if (busy || !recovered && !window.confirm("Quitter et abandonner le texte non enregistré ? La copie locale est indisponible.")) {
        event.preventDefault(); event.stopPropagation();
        if (busy) setError("Une opération éditoriale est en cours. Attendez son résultat avant de quitter.");
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", navigate, true);
    return () => {window.removeEventListener("beforeunload", warn); window.removeEventListener("click", navigate, true);};
  }, [dirty, notesDirty, busy, recovered]);
  function edit(next: EditorialContent) {remember(next); setForm(next); setDirty(true); setChecks({facts:false, french:false, arabic:false, duplicates:false});}
  async function compare() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    const token = sequence.current;
    try {const result = await fetchState(); if (token === sequence.current) {setRemote(result); setJobs(result.suggestions ?? []); if (result.suggestionsUnavailable) setError("Suggestions IA indisponibles ; la rédaction manuelle reste disponible.");}}
    catch(e) {if (token === sequence.current) setError(e instanceof Error ? e.message : "Lecture indisponible.");}
    finally {inFlight.current = false; setBusy(false);}
  }
  async function action(action: string, extra: Record<string, unknown> = {}) {
    if (!base || inFlight.current) return;
    if (["publish", "rollback"].includes(action) && !window.confirm(action === "publish" ? "Publier la révision relue ? Le français sera visible sur la fiche ; l’arabe sera conservé dans la publication bilingue." : "Restaurer la publication précédente sans modifier le brouillon ?")) return;
    if (extra.job && dirty && !window.confirm("Importer cette suggestion dans une nouvelle révision et remplacer votre texte non enregistré ?")) return;
    inFlight.current = true; setBusy(true); setError("");
    const token = sequence.current;
    try {
      const response = await fetch("/api/admin/seo/editorial", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
        id, version:base.version, revision:base.revision, source:base.source, action, notes, checklist:checks,
        ...(action === "save" ? {content:form} : {}), confirmed:true, ...extra,
      })});
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Résultat inconnu. Comparez avant de réessayer.");
      if (token !== sequence.current) return;
      forget();
      setBase(result); setForm(result.head?.content ?? blankEditorial()); setDirty(false); setRemote(null);
      setChecks({facts:false, french:false, arabic:false, duplicates:false}); setError(result.warning ?? ""); onChanged();
    } catch(e) {if (token === sequence.current) setError(e instanceof Error ? e.message : "Résultat inconnu. Comparez avant de réessayer.");}
    finally {inFlight.current = false; setBusy(false);}
  }
  async function more(kind: "revisions" | "events") {
    if (!base || inFlight.current || !base[kind].length) return;
    inFlight.current = true; setBusy(true);
    const token = sequence.current;
    try {
      const query = kind === "revisions" ? `&before=${base.revisions.at(-1)!.revision}` : `&eventBefore=${base.events.at(-1)!.id}`;
      const result = await fetchState(query);
      if (token === sequence.current) setBase({...base, [kind]: [...base[kind], ...result[kind]]});
    } catch {setError("Historique indisponible. Réessayez.");}
    finally {inFlight.current = false; setBusy(false);}
  }
  const quality = base ? assessEditorial(form, base.source) : null;
  const review = base?.events.find(e => e.revision === base.revision && ["approved", "changes_requested"].includes(e.action));
  const publication = base?.events.find(e => ["publish", "rollback"].includes(e.action));
  const ready = !!base?.canEdit && !busy && notes.trim().length >= 10;
  return <section className={styles.panel} aria-label="Édition et publication bilingue">
    <h2>Révisions éditoriales français / العربية</h2>
    <p>Les suggestions IA restent intactes. Chaque enregistrement crée une révision ; toute correction exige une nouvelle relecture. Seul le propriétaire peut publier ou annuler une publication.</p>
    {error && <p role="alert">{error}</p>}
    {recoveryError && <p role="alert">{recoveryError}</p>}
    {dirty && recovered && <p role="status">Brouillon récupérable dans cet onglet après navigation ou actualisation. Enregistrez une révision pour le conserver après fermeture de l’onglet.</p>}
    <button disabled={busy} onClick={() => void compare()}>Comparer avec la version enregistrée</button>
    {remote && <aside><h3>Version serveur {remote.version} · révision {remote.revision}</h3>
      <pre dir="auto" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(remote.head?.content ?? blankEditorial(), null, 2)}</pre>
      <button disabled={busy} onClick={() => {if (window.confirm("Reprendre la version serveur en conservant votre texte pour fusion manuelle ? Une nouvelle sauvegarde et relecture seront nécessaires.")) {remember(form, notes, remote); setBase(remote); setRemote(null); setDirty(true); setChecks({facts:false, french:false, arabic:false, duplicates:false});}}}>Conserver mon texte et reprendre cette base</button>
      <button disabled={busy} onClick={() => {if (!(dirty || notesDirty) || window.confirm("Remplacer votre texte et vos notes non enregistrés par la version serveur ?")) {forget(); setNotes(""); setBase(remote); setForm(remote.head?.content ?? blankEditorial()); setRemote(null); setDirty(false); setChecks({facts:false, french:false, arabic:false, duplicates:false});}}}>Charger le texte serveur</button>
    </aside>}
    {base && <>
      <p>Version {base.version} · révision {base.revision} · {dirty ? "Modifications non enregistrées" : "Version enregistrée"}</p>
      <details><summary>Source à vérifier</summary><pre dir="auto" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(base.source, null, 2)}</pre></details>
      <fieldset disabled={busy || !base.canEdit}>
        {(["fr", "ar"] as const).map(locale => <div key={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
          <h3>{locale === "fr" ? "Français" : "العربية"}</h3>
          {(["title", "description", "productDescription"] as const).map(field => <label key={field} style={{display:"block"}}>{({title:"Titre", description:"Description SEO", productDescription:"Description produit"})[field]} ({locale})
            <textarea maxLength={2000} value={form[locale][field]} onChange={e => edit({...form, [locale]: {...form[locale], [field]:e.target.value}})}/>
          </label>)}
          <label>Mots-clés séparés par des virgules<textarea value={form[locale].keywords.join(",")} onChange={e => edit({...form, [locale]: {...form[locale], keywords:e.target.value.split(/[,،]/).slice(0,6)}})}/></label>
        </div>)}
        <h3>Justification des faits</h3>
        {form.evidence.map((entry, index) => <div key={index}>
          <select aria-label={`Langue preuve ${index+1}`} value={entry.locale} onChange={e => edit({...form, evidence:form.evidence.map((v,i) => i === index ? {...v, locale:e.target.value as "fr" | "ar"} : v)})}><option value="fr">Français</option><option value="ar">العربية</option></select>
          {(["claim", "sourceQuote"] as const).map(field => <label key={field}>{field === "claim" ? "Affirmation exacte" : "Citation exacte de la source"}<input dir="auto" maxLength={500} value={entry[field]} onChange={e => edit({...form, evidence:form.evidence.map((v,i) => i === index ? {...v,[field]:e.target.value} : v)})}/></label>)}
          <button onClick={() => edit({...form,evidence:form.evidence.filter((_,i) => i !== index)})}>Retirer la preuve {index+1}</button>
        </div>)}
        <button disabled={form.evidence.length >= 8} onClick={() => edit({...form,evidence:[...form.evidence,{locale:"fr",claim:"",sourceQuote:""}]})}>Ajouter une preuve</button>
        <p>{quality?.valid ? "Contrôles automatiques satisfaits ; relecture humaine requise." : `À corriger avant approbation : ${quality?.errors.join(", ")}`}</p>
        <label>Notes et motif (10 caractères minimum)<textarea maxLength={2000} value={notes} onChange={e => {remember(form, e.target.value); setNotes(e.target.value); setNotesDirty(true);}}/></label>
        <button disabled={!ready} onClick={() => void action("save")}>Enregistrer une nouvelle révision</button>
        {jobs.map(job => <div key={job.id}>
          {job.content && <details><summary>Voir la suggestion {job.tier} · {job.id.slice(0,8)}</summary>
            {(["fr", "ar"] as const).map(locale => <div key={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
              <h4>{job.content![locale].title}</h4><p>{job.content![locale].description}</p><p>{job.content![locale].productDescription}</p>
              <p>{job.content![locale].keywords.join(", ")}</p>
            </div>)}
          </details>}
          <button disabled={!ready} onClick={() => void action("save",{job:job.id})}>Importer la suggestion {job.tier} · {job.id.slice(0,8)}</button>
        </div>)}
        {Object.entries({facts:"Faits et unités vérifiés",french:"Français relu",arabic:"Arabe relu",duplicates:"Comparaison avec les autres produits effectuée"}).map(([key,label]) => <label key={key} style={{display:"block"}}><input type="checkbox" checked={checks[key]} onChange={e => setChecks({...checks,[key]:e.target.checked})}/>{label}</label>)}
        <button disabled={!ready || dirty || !base.head || !quality?.valid || !Object.values(checks).every(Boolean)} onClick={() => void action("approved")}>Approuver cette révision sans publier</button>
        <button disabled={!ready || dirty || !base.head} onClick={() => void action("changes_requested")}>Demander des corrections</button>
        {base.canPublish && <>
          <button disabled={!ready || dirty || review?.action !== "approved"} onClick={() => void action("publish")}>Publier la révision approuvée</button>
          <button disabled={!ready || dirty || !publication} onClick={() => void action("rollback",{event:publication?.id})}>Annuler la dernière publication</button>
        </>}
      </fieldset>
      <p>Le français publié alimente les métadonnées et la description produit. L’arabe reste dans la publication bilingue, sans créer de nouvelle route publique.</p>
      <details><summary>Historique des révisions et décisions</summary>
        {base.revisions.map(revision => <article key={revision.revision}><p>Révision {revision.revision} · {revision.actor} · {revision.created_at}</p>
          <pre dir="auto" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(revision.content,null,2)}</pre>
          <button disabled={busy || !base.canEdit} onClick={() => {if (!dirty || window.confirm("Remplacer le texte local par cette révision historique ?")) edit(revision.content);}}>Reprendre comme nouveau brouillon</button>
        </article>)}
        <button disabled={busy || !base.revisions.length} onClick={() => void more("revisions")}>Révisions plus anciennes</button>
        {base.events.map(event => <p key={event.id}>{event.action} · révision {event.revision} · {event.actor} · {event.created_at} — {event.notes}</p>)}
        <button disabled={busy || !base.events.length} onClick={() => void more("events")}>Décisions plus anciennes</button>
      </details>
    </>}
  </section>;
}
