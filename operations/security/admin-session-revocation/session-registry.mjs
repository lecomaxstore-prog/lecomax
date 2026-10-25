// Separate review prototype, NOT imported by Release E or production.
// Store adapters must use a private, uncached server-side connection.
const enc=new TextEncoder(),dec=new TextDecoder();
const encode=b=>btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export function createRegistry({secret,store,now=Date.now}){
 if(typeof secret!=='string'||secret.length<32)throw Error('SESSION_CONFIGURATION_REQUIRED');
 const key=()=>crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 async function claims(token){try{
  if(typeof token!=='string'||token.length>4096)return null;
  const parts=token.split('.');if(parts.length!==2)return null;
  if(!await crypto.subtle.verify('HMAC',await key(),decode(parts[1]),enc.encode(parts[0])))return null;
  const p=JSON.parse(dec.decode(decode(parts[0]))),t=now();
  if(p.v!==2||p.aud!=='lecomax-admin'||typeof p.email!=='string'||p.email!==p.email.trim().toLowerCase()||!p.email.includes('@')||!/^[-_a-zA-Z0-9]{43}$/.test(p.sid)||!Number.isSafeInteger(p.iat)||!Number.isSafeInteger(p.exp)||p.iat>t||p.exp<=t||p.exp<=p.iat||p.exp-p.iat>30*86400000)return null;
  return p;
 }catch{return null;}}
 return {
  async issue(email,ttl=86400000){
   email=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+$/.test(email)||email.length>254||!Number.isSafeInteger(ttl)||ttl<1||ttl>30*86400000)throw Error('INVALID_SESSION');
   const p={v:2,aud:'lecomax-admin',sid:encode(crypto.getRandomValues(new Uint8Array(32))),email,iat:now(),exp:now()+ttl};
   const body=encode(enc.encode(JSON.stringify(p))),token=body+'.'+encode(new Uint8Array(await crypto.subtle.sign('HMAC',await key(),enc.encode(body))));
   await store.insert({key_hash:await digest(p.sid),email,issued_at:p.iat,expires_at:p.exp,revoked_at:null});
   return token; // Never issue if durable registration failed.
  },
  async verify(token){try{const p=await claims(token);if(!p)return null;const row=await store.get(await digest(p.sid));return row&&row.revoked_at===null&&row.email===p.email&&row.issued_at===p.iat&&row.expires_at===p.exp&&row.expires_at>now()?p.email:null;}catch{return null;}},
  async revoke(token){const p=await claims(token);if(!p)return;await store.revoke(await digest(p.sid),now());},
  async revokeAll(email){await store.revokeAll(email.trim().toLowerCase(),now());}
 };
}
