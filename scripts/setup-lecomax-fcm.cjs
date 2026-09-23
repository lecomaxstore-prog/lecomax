// Run only with explicit approval to create the dedicated Expo FCM credential.
// Credentials stay in the Git/EAS-excluded mobile/.credentials directory.
const fs = require('node:fs');
const path = require('node:path');
const firebaseRoot = process.env.FIREBASE_CLI_ROOT;
if (!firebaseRoot) throw new Error('Set FIREBASE_CLI_ROOT to the installed firebase-tools package.');
const { configstore } = require(path.join(firebaseRoot, 'lib/configstore'));
const { getAccessToken } = require(path.join(firebaseRoot, 'lib/auth'));
const project = 'lecomax-notifications-298c2e';
const projectNumber = '170192204012';
const email = `expo-push@${project}.iam.gserviceaccount.com`;
const role = 'roles/firebasecloudmessaging.admin';
const keyPath = path.resolve(__dirname, '../mobile/.credentials/lecomax-expo-fcm.json');

(async () => {
  const auth = await getAccessToken(configstore.get('tokens').refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  async function request(url, method = 'GET', body) {
    const response = await fetch(url, {
      method, headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(`${method} ${new URL(url).pathname}: ${response.status} ${result.error?.message || 'Google API error'}`);
      error.status = response.status;
      throw error;
    }
    return result;
  }
  const enabled = await request(`https://serviceusage.googleapis.com/v1/projects/${projectNumber}/services:batchEnable`, 'POST', {
    serviceIds: ['iam.googleapis.com', 'fcm.googleapis.com'],
  });
  if (enabled.name && !enabled.done) {
    let operation = enabled;
    for (let attempt = 0; attempt < 30 && !operation.done; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      operation = await request(`https://serviceusage.googleapis.com/v1/${enabled.name}`);
    }
    if (!operation.done || operation.error) throw new Error('API enablement incomplete; retry later.');
  }
  const accountUrl = `https://iam.googleapis.com/v1/projects/${project}/serviceAccounts/${email}`;
  try { await request(accountUrl); }
  catch (error) {
    if (error.status !== 404) throw error;
    await request(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts`, 'POST', {
      accountId: 'expo-push', serviceAccount: { displayName: 'Expo push notifications', description: 'Sends Lecomax Android notifications through Expo FCM V1.' },
    });
  }
  const policyUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${project}`;
  const policy = await request(`${policyUrl}:getIamPolicy`, 'POST', { options: { requestedPolicyVersion: 3 } });
  policy.bindings ??= [];
  const member = `serviceAccount:${email}`;
  let binding = policy.bindings.find(item => item.role === role && !item.condition);
  if (!binding) { binding = { role, members: [] }; policy.bindings.push(binding); }
  if (!binding.members.includes(member)) {
    binding.members.push(member);
    await request(`${policyUrl}:setIamPolicy`, 'POST', { policy });
  }
  if (!fs.existsSync(keyPath)) {
    const existing = await request(`${accountUrl}/keys?keyTypes=USER_MANAGED`);
    if (existing.keys?.length) throw new Error('A user-managed key already exists; refusing to generate a duplicate.');
    const key = await request(`${accountUrl}/keys`, 'POST', { privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE', keyAlgorithm: 'KEY_ALG_RSA_2048' });
    const contents = Buffer.from(key.privateKeyData, 'base64');
    const parsed = JSON.parse(contents);
    if (parsed.project_id !== project || parsed.client_email !== email) throw new Error('Returned credential identity mismatch.');
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(keyPath, contents, { flag: 'wx', mode: 0o600 });
  }
  const verified = await request(`${policyUrl}:getIamPolicy`, 'POST', {});
  if (!verified.bindings.some(item => item.role === role && item.members.includes(member))) throw new Error('FCM role verification failed.');
  console.log(JSON.stringify({ project, serviceAccount: email, role, keyFile: keyPath, verified: true }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
