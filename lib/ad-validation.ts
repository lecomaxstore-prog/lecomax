const TYPES = new Set(["popup", "topbar", "corner", "floating"]);
const FREQUENCIES = new Set(["always", "once_session", "once_day", "once_total"]);
const TARGETS = new Set(["all", "home", "boutique", "product", "cart"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function nullableText(value: unknown, max: number) { return text(value, max) || null; }
function color(value: unknown, fallback: string) {
  const candidate = text(value, 20);
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}
function safeUrl(value: unknown, internalOnly = false) {
  const candidate = text(value, 1200);
  if (!candidate) return null;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  if (internalOnly) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}
function safeDate(value: unknown) {
  const candidate = text(value, 40);
  return candidate && Number.isFinite(Date.parse(candidate)) ? new Date(candidate).toISOString() : null;
}

export function parseAdInput(value: unknown, partial = false) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Données invalides." };
  const body = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  const set = (key: string, parsed: unknown) => { if (!partial || key in body) output[key] = parsed; };

  const title = text(body.title, 120);
  if ((!partial || "title" in body) && title.length < 2) return { error: "Titre requis." };
  set("title", title);
  if ((!partial || "type" in body) && !TYPES.has(String(body.type))) return { error: "Type invalide." };
  set("type", String(body.type));
  set("heading", nullableText(body.heading, 180));
  set("body", nullableText(body.body, 1000));
  set("image_url", safeUrl(body.image_url));
  set("button_label", nullableText(body.button_label, 80));
  set("button_href", safeUrl(body.button_href, true));
  set("bg_color", color(body.bg_color, "#000000"));
  set("text_color", color(body.text_color, "#ffffff"));
  set("accent_color", color(body.accent_color, "#3ecf4c"));
  set("delay_seconds", Math.min(300, Math.max(0, Math.floor(Number(body.delay_seconds) || 0))));
  set("start_at", safeDate(body.start_at));
  set("end_at", safeDate(body.end_at));
  if ((!partial || "frequency" in body) && !FREQUENCIES.has(String(body.frequency))) return { error: "Fréquence invalide." };
  set("frequency", String(body.frequency));
  if ((!partial || "target_pages" in body) && !TARGETS.has(String(body.target_pages))) return { error: "Ciblage invalide." };
  set("target_pages", String(body.target_pages));
  set("active", body.active === true);
  set("sort_order", Math.min(10_000, Math.max(-10_000, Math.floor(Number(body.sort_order) || 0))));
  return { value: output };
}
