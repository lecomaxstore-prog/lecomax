export type ProductColorImageMap = Record<string, string[]>;

const COLOR_IMAGES_TAG = "__cimages:";
const MAX_COLORS = 40;
const MAX_IMAGES_PER_COLOR = 20;

function isValidImageUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function cleanColorImageMap(value: unknown): ProductColorImageMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_COLORS) return null;

  const cleaned: ProductColorImageMap = {};
  for (const [rawColor, rawImages] of entries) {
    const color = rawColor.trim().slice(0, 80);
    if (!color || !Array.isArray(rawImages) || rawImages.length > MAX_IMAGES_PER_COLOR) return null;
    const images = [...new Set(rawImages.map((image) => String(image ?? "").trim()))];
    if (images.some((image) => !image || image.length > 2_000 || !isValidImageUrl(image))) return null;
    cleaned[color] = images;
  }
  return cleaned;
}

export function colorImageMapFromTags(value: unknown): ProductColorImageMap {
  if (!Array.isArray(value)) return {};
  const map: ProductColorImageMap = {};
  for (const tag of value) {
    if (typeof tag !== "string" || !tag.startsWith(COLOR_IMAGES_TAG)) continue;
    try {
      const parsed = JSON.parse(tag.slice(COLOR_IMAGES_TAG.length));
      if (!Array.isArray(parsed) || parsed.length !== 2 || typeof parsed[0] !== "string") continue;
      const row = cleanColorImageMap({ [parsed[0]]: parsed[1] });
      if (row) Object.assign(map, row);
    } catch { /* Ignore malformed internal metadata. */ }
  }
  return map;
}

export function syncColorImageTags(tags: string[], map?: ProductColorImageMap) {
  const regularTags = tags.filter((tag) => !tag.startsWith(COLOR_IMAGES_TAG));
  if (!map) return regularTags;
  for (const [color, images] of Object.entries(map)) {
    if (images.length > 0) regularTags.push(`${COLOR_IMAGES_TAG}${JSON.stringify([color, images])}`);
  }
  return regularTags;
}

export function primaryColorImages(map?: ProductColorImageMap) {
  if (!map) return undefined;
  const entries = Object.entries(map).flatMap(([color, images]) => images[0] ? [[color, images[0]] as const] : []);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function legacyColorImageMap(colors: string[], images: string[], primary?: Record<string, string>) {
  const mapped = Object.fromEntries(colors.flatMap((color, index) => {
    const image = primary?.[color] ?? images[index];
    return image ? [[color, [image]]] : [];
  }));
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}
