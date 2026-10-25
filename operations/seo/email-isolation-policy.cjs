// Offline review helpers only. No network, secret access, provisioning or execution.
const assert=require('node:assert/strict');
const baseline=require('./email-isolation-plan.json');
function validateIsolationPolicy(plan){
  try{
    assert.equal(plan.projectRef,'tyltharlnbxrxibuxyye');assert.equal(plan.executionAllowed,false);
    assert.equal(plan.implementation,baseline.implementation);assert.equal(plan.smtpPort,587);
    // Exact environment contract excludes relay, forwarding, remote database,
    // accept-any authentication and inherited unreviewed runtime options.
    assert.deepEqual(plan.environment,baseline.environment);
    assert.deepEqual(plan.runtime,baseline.runtime);
    assert.deepEqual(plan.supabasePreserve,baseline.supabasePreserve);
    return {staticPolicyValidated:true,hostedIsolationProven:false};
  }catch{throw Error('STAGING_EMAIL_POLICY_REJECTED');}
}
function establishExpectedOrg(project,deployment,env){
  // Inputs MUST come from authenticated provider GETs and the genuine build.
  // Mockable for offline tests; this function cannot attest their provenance.
  try{
    assert.equal(project.id,'prj_jPniwpH4s81bhISVReUKTQN0GwvD');
    assert.equal(project.name,'lecomax-seo-staging');
    assert.equal(project.accountId,'team_yFLUcpSvgQi8EQuvuorOZW7w');
    assert.equal(deployment.projectId,project.id);assert.equal(deployment.teamId,project.accountId);
    assert.equal(deployment.target,'preview');assert.equal(env.VERCEL,'1');assert.equal(env.VERCEL_ENV,'preview');
    assert.equal(env.VERCEL_PROJECT_ID,project.id);assert.equal(env.VERCEL_DEPLOYMENT_ID,deployment.id);
    assert.match(deployment.id,/^dpl_[A-Za-z0-9]+$/);
    if(env.VERCEL_ORG_ID!==undefined)assert.equal(env.VERCEL_ORG_ID,project.accountId);
    return project.accountId;
  }catch{throw Error('STAGING_IDENTITY_REJECTED');}
}
module.exports={validateIsolationPolicy,establishExpectedOrg};
