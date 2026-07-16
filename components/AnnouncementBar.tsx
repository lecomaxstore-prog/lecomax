import type { CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_MESSAGES = [
  "LIVRAISON GRATUITE DÈS 500 MAD AU MAROC",
  "RETOURS GRATUITS SOUS 30 JOURS",
  "PAIEMENT À LA LIVRAISON DISPONIBLE",
];

const SETTING_KEYS = [
  "announcement_enabled",
  "announcement_1",
  "announcement_2",
  "announcement_3",
  "announcement_4",
  "announcement_5",
  "announcement_background",
  "announcement_accent",
  "announcement_text_color",
  "announcement_speed",
  "announcement_pause_hover",
  "announcement_show_icons",
  "announcement_uppercase",
  "announcement_mobile_enabled",
];

function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value! : fallback;
}

export default async function AnnouncementBar() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from("settings").select("key,value").in("key", SETTING_KEYS);
  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, String(row.value ?? "")]));

  if (settings.announcement_enabled === "false") return null;

  const configured = [1, 2, 3, 4, 5]
    .map((index) => settings[`announcement_${index}`]?.trim())
    .filter((value): value is string => Boolean(value));
  const messages = configured.length > 0 ? configured : DEFAULT_MESSAGES;
  const repeats = Array.from({ length: Math.max(12, messages.length * 4) }, (_, index) => messages[index % messages.length]);

  const background = safeColor(settings.announcement_background, "#09090b");
  const accent = safeColor(settings.announcement_accent, "#3ecf4c");
  const textColor = safeColor(settings.announcement_text_color, "#ffffff");
  const parsedSpeed = Number(settings.announcement_speed);
  const speed = Number.isFinite(parsedSpeed) ? Math.min(120, Math.max(12, parsedSpeed)) : 36;
  const showIcons = settings.announcement_show_icons !== "false";
  const uppercase = settings.announcement_uppercase !== "false";
  const mobileEnabled = settings.announcement_mobile_enabled !== "false";

  return (
    <div
      className={`relative overflow-hidden select-none ${mobileEnabled ? "block" : "hidden sm:block"}`}
      style={{ backgroundColor: background, color: textColor }}
      aria-label="Informations de la boutique"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-90" style={{ backgroundColor: accent }} />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20" style={{ background: `linear-gradient(to right, ${background}, transparent)` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20" style={{ background: `linear-gradient(to left, ${background}, transparent)` }} />

      <div
        className="marquee-track py-2 text-[10px] font-bold tracking-[0.16em] sm:py-2.5 sm:text-[11px]"
        data-pause-on-hover={settings.announcement_pause_hover !== "false"}
        style={{ animationDuration: `${speed}s` } as CSSProperties}
      >
        {repeats.map((text, index) => (
          <span key={`${text}-${index}`} className="inline-flex items-center gap-2.5" style={{ color: textColor }}>
            {showIcons && (
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}22`, color: accent }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
                </svg>
              </span>
            )}
            <span className={uppercase ? "uppercase" : "normal-case"}>{text}</span>
            <span className="mx-4 text-[7px] opacity-50" style={{ color: accent }} aria-hidden="true">◆</span>
          </span>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
    </div>
  );
}
