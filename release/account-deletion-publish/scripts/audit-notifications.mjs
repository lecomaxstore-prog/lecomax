// Read-only: never registers devices, publishes products, or sends notifications.
import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const table of ['mobile_push_tokens', 'mobile_notifications', 'mobile_notification_campaigns', 'mobile_notification_preferences', 'mobile_web_push_subscriptions', 'mobile_push_receipts']) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
  console.log(JSON.stringify({ table, count, error: error?.code ?? null }));
}
const { data: settings, error } = await db.from('settings').select('key,value').eq('key', 'app_notifications_enabled');
console.log(JSON.stringify({ settings, error: error?.code ?? null }));
for (const platform of ['android', 'ios']) {
  const { count, error } = await db.from('mobile_push_tokens').select('id', { count: 'exact', head: true }).eq('active', true).eq('platform', platform);
  console.log(JSON.stringify({ activePlatform: platform, count, error: error?.code ?? null }));
}
console.log(JSON.stringify({ configuration: Object.fromEntries(['CRON_SECRET', 'EXPO_ACCESS_TOKEN', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'].map(key => [key, Boolean(process.env[key])])) }));
for (const base of ['http://127.0.0.1:3000', 'https://lecomax.com']) {
  for (const [path, method, body] of [
    ['/api/mobile/notifications?platform=web', 'GET'],
    ['/api/mobile/notification-preferences', 'GET'],
    ['/api/mobile/push-subscribe', 'POST', '{}'],
    ['/api/cron/mobile-campaigns', 'GET'],
    ['/api/mobile/notification-preferences', 'OPTIONS'],
  ]) {
    try {
      const res = await fetch(base + path, { method, body, headers: { Origin: 'http://localhost:8081', ...(body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(30000) });
      console.log(JSON.stringify({ base, path, method, status: res.status, cors: res.headers.get('access-control-allow-origin') }));
    } catch (error) { console.log(JSON.stringify({ base, path, error: error.name })); }
  }
}
