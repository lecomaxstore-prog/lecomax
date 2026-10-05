// Storage is optional: privacy settings and quota limits must not break checkout.
// The in-memory copy also preserves retries and confirmation across client navigation.
const fallback = new Map<string, string | null>();
type StorageKind = "localStorage" | "sessionStorage";

export function browserStorage(kind: StorageKind) {
  return {
    getItem(key: string): string | null {
      if (typeof window === "undefined") return null;
      if (fallback.has(`${kind}:${key}`)) return fallback.get(`${kind}:${key}`) ?? null;
      try { return window[kind].getItem(key); }
      catch { return fallback.get(`${kind}:${key}`) ?? null; }
    },
    setItem(key: string, value: string) {
      if (typeof window === "undefined") return;
      fallback.set(`${kind}:${key}`, value);
      try { window[kind].setItem(key, value); fallback.delete(`${kind}:${key}`); } catch { /* Retain the in-memory copy. */ }
    },
    removeItem(key: string) {
      if (typeof window === "undefined") return;
      fallback.set(`${kind}:${key}`, null);
      try { window[kind].removeItem(key); fallback.delete(`${kind}:${key}`); } catch { /* Storage is optional. */ }
    },
  };
}

export const safeLocalStorage = browserStorage("localStorage");
export const safeSessionStorage = browserStorage("sessionStorage");
