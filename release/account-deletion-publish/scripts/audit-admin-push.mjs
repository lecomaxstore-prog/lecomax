// Read-only diagnostic. Never exposes keys or device endpoints and never sends push.
import { createECDH } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const clean = key => (process.env[key] ?? '').replace(/\s+/g, '');
let matchingKeys = false;
try {
  const curve = createECDH('prime256v1');
  curve.setPrivateKey(Buffer.from(clean('VAPID_PRIVATE_KEY'), 'base64url'));
  matchingKeys = curve.getPublicKey().equals(Buffer.from(clean('NEXT_PUBLIC_VAPID_PUBLIC_KEY'), 'base64url'));
} catch { /* Report only validity, never key contents. */ }
console.log(JSON.stringify({ vapidKeysMatch: matchingKeys, subjectConfigured: Boolean(clean('VAPID_SUBJECT')) }));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count, error } = await db.from('push_subscriptions').select('*', { count: 'exact', head: true }).like('user_agent', '[LECOMAX_ADMIN] %');
console.log(JSON.stringify({ registeredAdminDevices: count, databaseError: error?.code ?? (error ? 'CONNECTION_FAILED' : null) }));
if (error) process.exitCode = 1;
