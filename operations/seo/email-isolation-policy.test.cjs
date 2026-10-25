const test=require('node:test'),assert=require('node:assert/strict');
const {validateIsolationPolicy,establishExpectedOrg}=require('./email-isolation-policy.cjs');
const fixture=()=>structuredClone(require('./email-isolation-plan.json'));
test('offline plan passes without claiming deployment or runtime enforcement',()=>{
  assert.deepEqual(validateIsolationPolicy(fixture()),{staticPolicyValidated:true,hostedIsolationProven:false});
});
test('all forwarding and relay environment additions fail closed',()=>{
  for(const name of ['MP_SMTP_FORWARD_CONFIG','MP_SMTP_FORWARD_HOST','MP_SMTP_RELAY_CONFIG','MP_SMTP_RELAY_HOST','MP_SMTP_RELAY_ALL','MP_SMTP_RELAY_MATCHING']){
    const p=fixture();p.environment[name]='synthetic';assert.throws(()=>validateIsolationPolicy(p),/POLICY_REJECTED/);
  }
});
test('insecure authentication, remote storage, public UI and TLS downgrade are rejected',()=>{
  for(const [name,value] of [['MP_SMTP_AUTH_ACCEPT_ANY','true'],['MP_SMTP_AUTH_ALLOW_INSECURE','true'],['MP_SMTP_REQUIRE_STARTTLS','false'],['MP_DATABASE','https://example.invalid/db'],['MP_UI_BIND_ADDR','0.0.0.0:8025']]){
    const p=fixture();p.environment[name]=value;assert.throws(()=>validateIsolationPolicy(p),/POLICY_REJECTED/);
  }
});
test('missing network enforcement or restored provider mail features are rejected',()=>{
  for(const section of ['runtime','supabasePreserve'])for(const name of Object.keys(fixture()[section])){
    const p=fixture();p[section][name]=!p[section][name];assert.throws(()=>validateIsolationPolicy(p),/POLICY_REJECTED/);
  }
});
test('wrong database or execution permission cannot enter preparation plan',()=>{
  for(const patch of [{projectRef:'production'},{executionAllowed:true}])assert.throws(()=>validateIsolationPolicy({...fixture(),...patch}),/POLICY_REJECTED/);
});
const identity=()=>[{id:'prj_jPniwpH4s81bhISVReUKTQN0GwvD',name:'lecomax-seo-staging',accountId:'team_yFLUcpSvgQi8EQuvuorOZW7w'},
  {id:'dpl_synthetic',projectId:'prj_jPniwpH4s81bhISVReUKTQN0GwvD',teamId:'team_yFLUcpSvgQi8EQuvuorOZW7w',target:'preview'},
  {VERCEL:'1',VERCEL_ENV:'preview',VERCEL_PROJECT_ID:'prj_jPniwpH4s81bhISVReUKTQN0GwvD',VERCEL_DEPLOYMENT_ID:'dpl_synthetic'}];
test('org context is derived from matching provider records, not assumed env presence',()=>assert.equal(establishExpectedOrg(...identity()),'team_yFLUcpSvgQi8EQuvuorOZW7w'));
test('wrong project, team, deployment, production target and conflicting org are rejected',()=>{
  for(const [index,key,value] of [[0,'id','production'],[0,'accountId','other'],[1,'projectId','other'],[1,'teamId','other'],[1,'target','production'],[2,'VERCEL_DEPLOYMENT_ID','dpl_other'],[2,'VERCEL_ORG_ID','other'],[2,'VERCEL','0']]){
    const args=identity();args[index][key]=value;assert.throws(()=>establishExpectedOrg(...args),/IDENTITY_REJECTED/);
  }
});
