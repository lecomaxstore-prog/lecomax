import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

// Share the exchange when React runs a callback effect more than once.
let exchange: { code: string; promise: Promise<void> } | undefined;
export function completeGoogleSignIn(callbackUrl: string) {
  const url = new URL(callbackUrl);
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (error) return Promise.reject(new Error(error));
  const code = url.searchParams.get("code");
  if (!code) return Promise.reject(new Error("Missing authentication code"));
  if (exchange?.code === code) return exchange.promise;
  const promise = (async () => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    if (!data.session) throw new Error("No session returned");
  })();
  exchange = { code, promise };
  return promise;
}

export async function startGoogleSignIn(returnTo: "account" | "profile") {
  const redirectTo = Platform.OS === "web"
    ? `${window.location.origin}/auth?returnTo=${returnTo}`
    : `lecomax://auth?returnTo=${returnTo}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in is unavailable");
  if (Platform.OS === "web") {
    window.location.assign(data.url);
    return false;
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;
  const callback = new URL(result.url);
  const expected = new URL(redirectTo);
  if (callback.protocol !== expected.protocol || callback.host !== expected.host || callback.pathname !== expected.pathname) {
    throw new Error("Unexpected authentication redirect");
  }
  await completeGoogleSignIn(result.url);
  return true;
}
