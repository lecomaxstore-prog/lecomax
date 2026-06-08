"use client";
import { useState, useEffect } from "react";

type SettingsMap = Record<string, string>;

let cache: SettingsMap | null = null;
const listeners: Set<(s: SettingsMap) => void> = new Set();

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>(cache ?? {});

  useEffect(() => {
    if (cache) {
      setSettings(cache);
      return;
    }
    fetch("/api/settings")
      .then(r => r.json())
      .then((rows: { key: string; value: string }[]) => {
        if (!Array.isArray(rows)) return;
        const map: SettingsMap = {};
        for (const row of rows) map[row.key] = row.value;
        cache = map;
        setSettings(map);
        listeners.forEach(fn => fn(map));
      })
      .catch(() => {});

    const fn = (s: SettingsMap) => setSettings(s);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return settings;
}

export function getWhatsAppHref(settings: SettingsMap, message?: string) {
  const raw = settings.whatsapp_number || "212699289568";
  const num = raw.replace(/[^0-9]/g, "");
  const text = message ?? "Bonjour, je voudrais plus d'informations sur vos produits.";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppDisplay(settings: SettingsMap) {
  const raw = settings.whatsapp_number || "212699289568";
  const num = raw.replace(/[^0-9]/g, "");
  return `+${num}`;
}
