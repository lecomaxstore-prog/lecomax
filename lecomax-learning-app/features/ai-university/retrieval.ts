export const sampleDocuments=[{id:'returns',text:'Returns are accepted within 14 days with a receipt.'},{id:'shipping',text:'Shipping takes 3 business days for local orders.'},{id:'study',text:'Spaced study revisits a topic after a delay.'}];
const terms=(text:string)=>text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
export function cosine(a:number[],b:number[]) {
  if(a.length!==b.length||a.some(v=>!Number.isFinite(v))||b.some(v=>!Number.isFinite(v)))throw Error('INVALID_VECTOR');
  const denom=Math.hypot(...a)*Math.hypot(...b);return denom?a.reduce((sum,v,i)=>sum+v*b[i]!,0)/denom:0;
}
export function retrieve(query:string,documents:{id:string;text:string}[],limit=3) {
  if(query.length>500||documents.length>40||documents.some(d=>d.text.length>2000))throw Error('RETRIEVAL_LIMIT');
  const words=[...new Set(terms(query))];
  return documents.map(d=>{
    const tokens=terms(d.text);const overlap=words.reduce((n,w)=>n+tokens.filter(t=>t===w).length,0);
    const counts=Object.values(tokens.reduce<Record<string,number>>((m,w)=>({...m,[w]:(m[w]||0)+1}),{}));
    const score=words.length&&counts.length?overlap/(Math.sqrt(words.length)*Math.hypot(...counts)):0;
    return {...d,score};
  }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
}
export function chunkDocument(text:string) {
  if(!text.trim()||text.length>12000)throw Error('DOCUMENT_LIMIT');
  const chunks:{id:string;text:string}[]=[];
  for(let i=0;i<text.length;i+=900)chunks.push({id:`source-${chunks.length+1}`,text:text.slice(i,i+1000)});
  return chunks;
}
