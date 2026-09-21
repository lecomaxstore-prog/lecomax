import Constants from "expo-constants";
import { Platform } from "react-native";

type RuntimeExtra = {
  apiUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeExtra;

function resolveApiUrl(configuredUrl: string, useMetroProxy = true) {
  const normalized = configuredUrl.replace(/\/$/, "");

  if (Platform.OS !== "web") return normalized;

  const browserHost = globalThis.location?.hostname;
  if (!browserHost) return normalized;
  // Metro proxies /api requests during local web development, avoiding CORS.
  if (useMetroProxy && __DEV__ && /^(localhost|127\.0\.0\.1)$/.test(browserHost)) {
    return globalThis.location.origin;
  }
  const configuredIsLocal = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(normalized);

  // Avoid browsers resolving localhost to IPv6 when the local API listens on IPv4.
  if (configuredIsLocal && browserHost === "localhost") {
    const localUrl = new URL(normalized);
    localUrl.hostname = "127.0.0.1";
    return localUrl.origin;
  }

  // Expo opened on a phone/LAN address must reach the API on the development PC.
  if (configuredIsLocal && /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(browserHost)) {
    const localUrl = new URL(normalized);
    localUrl.hostname = browserHost;
    return localUrl.origin;
  }

  return normalized;
}

export const runtimeConfig = {
  apiUrl: resolveApiUrl(extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || "https://lecomax.com"),
  // Opt-in local preview of an API route that has not been deployed yet.
  // Release builds always use the main API, even if a developer's env is present.
  translationApiUrl: __DEV__ && Platform.OS === "web" && /^(localhost|127\.0\.0\.1)$/.test(globalThis.location?.hostname || "")
    ? resolveApiUrl(process.env.EXPO_PUBLIC_TRANSLATION_API_URL || extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || "https://lecomax.com", !process.env.EXPO_PUBLIC_TRANSLATION_API_URL)
    : resolveApiUrl(extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || "https://lecomax.com"),
  supabaseUrl: extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
};
