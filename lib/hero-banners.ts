export type HeroBannerRecord = {
  id: string;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  button_label: string | null;
  button_href: string | null;
  button2_label: string | null;
  button2_href: string | null;
  image_desktop: string | null;
  image_mobile: string | null;
  overlay_opacity: number;
  sort_order: number;
  active: boolean;
  created_at: string;
};

function optionalText(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function safeUrl(value: unknown, kind: "image" | "link") {
  const url = String(value ?? "").trim();
  if (!url) return null;
  const allowed = kind === "image" ? /^(\/|https?:\/\/)/i : /^(\/|#|https?:\/\/)/i;
  return allowed.test(url) ? url.slice(0, 1200) : undefined;
}

export function validateHeroBanner(body: unknown, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Données invalides." };
  const source = body as Record<string, unknown>;
  const value: Record<string, unknown> = {};
  const textFields = { title: 120, subtitle: 240, badge: 60, button_label: 50, button2_label: 50 } as const;
  for (const [field, max] of Object.entries(textFields)) if (!partial || field in source) value[field] = optionalText(source[field], max);
  for (const field of ["button_href", "button2_href"] as const) if (!partial || field in source) {
    const url = safeUrl(source[field], "link");
    if (url === undefined) return { error: `Le lien ${field === "button_href" ? "principal" : "secondaire"} est invalide.` };
    value[field] = url;
  }
  for (const field of ["image_desktop", "image_mobile"] as const) if (!partial || field in source) {
    const url = safeUrl(source[field], "image");
    if (url === undefined) return { error: "L’adresse de l’image est invalide." };
    value[field] = url;
  }
  if (!partial && !value.image_desktop) return { error: "Une image web est obligatoire." };
  if ("overlay_opacity" in source || !partial) value.overlay_opacity = Math.max(0, Math.min(90, Math.round(Number(source.overlay_opacity) || 0)));
  if ("sort_order" in source || !partial) value.sort_order = Math.max(0, Math.min(9999, Math.trunc(Number(source.sort_order) || 0)));
  if ("active" in source || !partial) value.active = source.active !== false;
  if (!Object.keys(value).length) return { error: "Aucune modification valide reçue." };
  return { value };
}
