import { supabase } from "./supabase";

export const GOOGLE_RETURN_KEY = "lecomax_google_return";
const MAX_AGE = 10 * 60 * 1000;

export function safeAuthReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/compte";
  try {
    const url = new URL(value, "https://lecomax.invalid");
    if (url.origin !== "https://lecomax.invalid" || /^\/(?:auth|connexion|inscription)(?:\/|$)/.test(url.pathname)) return "/compte";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/compte"; }
}

export function pendingGoogleReturn(): string | null {
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_RETURN_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const age = Date.now() - value.createdAt;
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) {
      window.sessionStorage.removeItem(GOOGLE_RETURN_KEY);
      return null;
    }
    return safeAuthReturnPath(value.path);
  } catch { return null; }
}

export async function startGoogleSignIn(path: string) {
  // Keep the destination in this tab: a fixed callback also avoids allow-list
  // mismatches caused by arbitrary destination query strings.
  window.sessionStorage.setItem(GOOGLE_RETURN_KEY, JSON.stringify({ path: safeAuthReturnPath(path), createdAt: Date.now() }));
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url) throw new Error("La connexion Google est indisponible. Veuillez réessayer.");
    window.location.assign(data.url);
  } catch (error) {
    window.sessionStorage.removeItem(GOOGLE_RETURN_KEY);
    throw error;
  }
}
