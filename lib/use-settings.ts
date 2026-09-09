"use client";

import { useEffect, useState } from "react";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import { STORE_SETTING_DEFAULTS } from "@/lib/store-settings";

export type SettingsMap = Record<string, string>;

let cache: SettingsMap | null = null;
let request: Promise<SettingsMap> | null = null;
let settingsTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(settings: SettingsMap) => void>();
const CHANNEL_NAME = "lecomax-settings";
const STORAGE_EVENT_KEY = "lecomax_settings_updated_at";

function emit(settings: SettingsMap) {
  cache = settings;
  listeners.forEach((listener) => listener(settings));
}

export async function refreshSettings(): Promise<SettingsMap> {
  if (!request) {
    request = fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossible de charger les paramètres");
        const rows = await response.json() as { key: string; value: string }[];
        const map: SettingsMap = {};
        if (Array.isArray(rows)) for (const row of rows) map[row.key] = String(row.value ?? "");
        emit(map);
        return map;
      })
      .finally(() => { request = null; });
  }
  return request;
}

/** Immediately updates this tab and asks other storefront tabs to refetch. */
export function publishSettings(settings: SettingsMap) {
  emit({ ...settings });
  try {
    localStorage.setItem(STORAGE_EVENT_KEY, String(Date.now()));
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage("updated");
    channel.close();
  } catch { /* BroadcastChannel/localStorage may be unavailable in private mode. */ }
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>(cache ?? {});

  useEffect(() => {
    const firstSubscriber = listeners.size === 0;
    const listener = (next: SettingsMap) => setSettings(next);
    listeners.add(listener);
    if (cache) setSettings(cache);
    else void refreshSettings().catch(() => {});

    const refresh = () => { void refreshSettings().catch(() => {}); };
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_EVENT_KEY) refresh(); };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", refresh);
    } catch { /* unsupported browser */ }
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    if (firstSubscriber) settingsTimer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30_000);

    return () => {
      listeners.delete(listener);
      if (!listeners.size && settingsTimer) { clearInterval(settingsTimer); settingsTimer = null; }
      channel?.removeEventListener("message", refresh);
      channel?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return settings;
}

export function useShippingConfig() {
  return shippingConfigFromSettings(useSettings());
}

export function getWhatsAppHref(settings: SettingsMap, message?: string) {
  const raw = settings.whatsapp_number ?? STORE_SETTING_DEFAULTS.whatsapp_number;
  const num = raw.replace(/[^0-9]/g, "");
  const text = message ?? "Bonjour, je voudrais plus d'informations sur vos produits.";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppDisplay(settings: SettingsMap) {
  const raw = settings.whatsapp_number ?? STORE_SETTING_DEFAULTS.whatsapp_number;
  return `+${raw.replace(/[^0-9]/g, "")}`;
}
