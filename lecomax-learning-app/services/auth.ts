import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { createSessionClient, SessionError } from './owner-session';
import { resolveApiOrigin } from './api-origin';
export const API = resolveApiOrigin(process.env.EXPO_PUBLIC_LEARNING_API_URL, __DEV__);
const KEY = 'lecomax-owner-refresh-v1';
const LEGACY_KEY = 'lecomax-learning-owner';
function checkedUrl() {
  const url = new URL(API);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new SessionError(0, 'INVALID_API_URL');
  if (url.protocol !== 'https:' && (!__DEV__ || url.protocol !== 'http:'))
    throw new SessionError(0, 'HTTPS_REQUIRED');
  return API;
}
export const auth = createSessionClient({
  device: Constants.deviceName?.slice(0, 100) || Platform.OS,
  read: async () => {
    if (Platform.OS === 'web') return null;
    await SecureStore.deleteItemAsync(LEGACY_KEY);
    return SecureStore.getItemAsync(KEY);
  },
  save: async (token) => {
    if (Platform.OS === 'web') throw new SessionError(0, 'NATIVE_DEVICE_REQUIRED');
    await SecureStore.setItemAsync(KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  remove: async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(KEY);
      await SecureStore.deleteItemAsync(LEGACY_KEY);
    }
  },
  request: async (action, body, access, method = 'POST') => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(
        checkedUrl() + '/api/learning-mobile/auth' + (action ? '/' + action : ''),
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(access ? { Authorization: 'Bearer ' + access } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: abort.signal,
          cache: 'no-store',
        },
      );
      const result = await response.json();
      if (!response.ok) throw new SessionError(response.status, result.error || 'UNAVAILABLE');
      return result;
    } catch (e) {
      if (e instanceof SessionError) throw e;
      throw new SessionError(0, 'NETWORK_OR_TIMEOUT');
    } finally {
      clearTimeout(timer);
    }
  },
});
export { SessionError };
