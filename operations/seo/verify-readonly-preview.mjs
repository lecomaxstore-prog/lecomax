// Prepared only. Never deploys, runs the credential verifier, or submits a form.
// Run only after separate authorization, provider identity review and verifier PASS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const plan=JSON.parse(fs.readFileSync(process.argv[2]||new URL('./readonly-preview-acceptance.json',import.meta.url),'utf8'));
assert.equal(plan.authorized,true,'Separate authorization required');
assert.equal(plan.hostedCredentialVerifierPassed,true,'Hosted credential gate required');
assert.equal(plan.vercelProjectId,'prj_jPniwpH4s81bhISVReUKTQN0GwvD');
assert.equal(plan.vercelTeamId,'team_yFLUcpSvgQi8EQuvuorOZW7w');
assert.equal(plan.supabaseOrigin,'https://tyltharlnbxrxibuxyye.supabase.co');
assert.equal(plan.dataProvenanceApproved,true);
const origin=new URL(plan.deploymentUrl);
assert(origin.protocol==='https:'&&origin.hostname.endsWith('.vercel.app')&&origin.pathname==='/'&&!origin.username&&!origin.password&&!origin.search&&!origin.hash);
assert.equal(origin.hostname,plan.providerVerifiedDeploymentHostname,'Use immutable provider-verified staging deployment');
assert(plan.providerIdentityEvidence&&plan.deploymentId&&plan.sourceManifestEvidence);
assert(/^\/produit\/[\p{L}\p{N}_%-]+\/$/u.test(plan.productPath));
assert(['/homme/','/femme/','/chaussures/','/accessoires/'].includes(plan.categoryPath));
const results=[];
async function read(path,status=200) {
  const target=new URL(path,origin);assert.equal(target.origin,origin.origin);
  // No protection bypass token is accepted or logged by this harness.
  // For protected deployments use the separately reviewed authenticated browser plan.
  const response=await fetch(target,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,status,path);
  assert(response.headers.get('x-robots-tag')?.includes('noindex'));
  assert(response.headers.get('content-security-policy')?.includes("connect-src 'self'"));
  const body=await response.text();assert(!body.includes('SEO Fixture Product'),'Local fixtures must never be deployed');
  results.push({path,status:response.status});return body;
}
try {
  for(const p of ['/', '/boutique/',plan.categoryPath,plan.productPath]) {
    const html=await read(p);assert(html.includes('<html'));assert(html.includes('https://lecomax.com'));
    if(p===plan.productPath){assert(html.includes('application/ld+json'));assert(html.includes(plan.expectedProductName));}
  }
  for(const p of ['/sitemap.xml','/sitemaps/static/','/sitemaps/products/0/','/sitemaps/categories/0/','/sitemaps/pages/0/','/sitemaps/posts/0/']) {
    const xml=await read(p);assert(xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9'));assert(!xml.includes(origin.hostname));
  }
  assert(/Disallow: \//.test(await read('/robots.txt')));
  for(const p of ['/connexion/','/panier/','/checkout/','/admin/','/api/orders','/api/auth/login','/api/cron/review-followups'])await read(p,403);
  console.log(JSON.stringify({at:new Date().toISOString(),passed:true,results,limitations:'HTTP reads only; authenticated browser, image hashes and blocked network evidence required separately.'}));
}catch{console.error('READONLY_ACCEPTANCE_FAILED_NO_RESPONSE_VALUES_LOGGED');process.exitCode=1;}
