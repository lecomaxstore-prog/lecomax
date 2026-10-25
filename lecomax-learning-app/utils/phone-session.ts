import * as SecureStore from 'expo-secure-store';
import { parsePhonePairingPayload } from './phone-pairing';

// Only direct Tailscale sessions are remembered. Keep credentials out of URLs,
// AsyncStorage and WebView storage. Serialize writes so a late save cannot undo Stop.
let writes: Promise<unknown> = Promise.resolve();
function key(origin: string) {
  return parsePhonePairingPayload(`${origin}|${'0'.repeat(32)}`)
    ? `lecomax.phone.session.${origin.replace(/[^a-zA-Z0-9.-]/g, '_')}` : null;
}
export async function readPhoneSession(origin: string): Promise<string> {
  const name = key(origin);
  if (!name) return '';
  await writes.catch(() => {});
  const token = await SecureStore.getItemAsync(name);
  return token && /^[a-f0-9]{32}$/.test(token) ? token : '';
}
export function savePhoneSession(origin: string, token: string): Promise<void> {
  const name = key(origin);
  if (!name) return Promise.resolve();
  if (token && !/^[a-f0-9]{32}$/.test(token)) return Promise.reject(new Error('Invalid session'));
  const operation = writes.catch(() => {}).then(() => token
    ? SecureStore.setItemAsync(name, token)
    : SecureStore.deleteItemAsync(name));
  writes = operation;
  return operation;
}
