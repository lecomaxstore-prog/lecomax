"use client";
import { useState } from "react";
import { assessEditorial, characterCount } from "@/operations/seo-vercel/lib/seo-editorial-quality.mjs";

type Draft = { fr: {title:string;description:string;keywords:string[];productDescription?:string}; ar: {title:string;description:string;keywords:string[];productDescription?:string}; evidence?: {locale:string;claim:string;sourceQuote:string}[] };
type Source = {name:string;brand?:string|null;model?:string|null;description?:string|null;category?:string|null};
export default function EditorialReview({draft,source,current,busy,onReview}:{draft:Draft;source?:Source;current:boolean;busy:boolean;onReview:(decision:string,checklist:Record<string,boolean>,notes:string)=>void}) {
  const [checks,setChecks]=useState<Record<string,boolean>>({facts:false,french:false,arabic:false,duplicates:false});
  const [notes,setNotes]=useState("");
  const raw={fr:draft.fr,ar:draft.ar,evidence:draft.evidence};
  const quality=source?assessEditorial(raw,source):null;
  const ready=!!quality?.valid&&current&&Object.values(checks).every(Boolean)&&notes.trim().length>=10;
  return <fieldset disabled={busy} aria-label="Relecture éditoriale obligatoire">
    <legend>Relecture factuelle et linguistique requise</legend>
    <p>Cette relecture conserve une décision sur la suggestion IA et ne publie aucun texte. Pour publier, importez la suggestion dans les révisions éditoriales, puis relisez et approuvez la révision enregistrée.</p>
    {source?<details><summary>Source du brouillon à comparer</summary><p>{source.name}</p><p>{source.brand} {source.model}</p><p>{source.description}</p></details>:<p>Source historique indisponible : approbation bloquée.</p>}
    {!current&&<p role="alert">La source a changé ou n’a pas été vérifiée. Actualisez la fiche avant de décider.</p>}
    {(["fr","ar"] as const).map(locale=><p key={locale}>{locale.toUpperCase()} : titre {characterCount(draft[locale].title)}/65 · description SEO {characterCount(draft[locale].description)}/160 caractères. Repères conseillés : 30–60 et 110–155 ; l’affichage dans les moteurs peut varier.</p>)}
    {quality&&!quality.valid&&<p role="alert">{quality.errors.length} contrôle(s) bloquant(s) : vérifier les longueurs, la langue, l’identité et les faits cités. Demandez une correction avant d’approuver.</p>}
    {!!quality?.warnings.length&&<p>Points à relire : formulation naturelle, précision des caractéristiques et pertinence des mots-clés. La comparaison avec les autres produits et la vérification des unités restent à effectuer ; les contrôles automatiques ne prouvent pas l’exactitude.</p>}
    {Object.entries({facts:"Chaque affirmation, nombre et unité correspond à la source",french:"Le français est naturel, utile et adapté au produit",arabic:"L’arabe est naturel ; seuls les vrais noms restent dans leur langue d’origine",duplicates:"J’ai comparé les descriptions avec celles des autres produits"}).map(([key,label])=><label key={key} style={{display:"block"}}><input type="checkbox" checked={checks[key]} onChange={e=>setChecks({...checks,[key]:e.target.checked})}/>{label}</label>)}
    <label>Notes de relecture (10 caractères minimum)<textarea value={notes} maxLength={2000} onChange={e=>setNotes(e.target.value)}/></label>
    <button disabled={!ready} onClick={()=>onReview("approved_for_publication",checks,notes.trim())}>Approuver la relecture sans publier</button>
    <button disabled={!current||notes.trim().length<10} onClick={()=>onReview("changes_requested",checks,notes.trim())}>Demander une correction</button>
  </fieldset>;
}
