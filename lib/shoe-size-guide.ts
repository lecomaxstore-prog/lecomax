export type ShoeGuideRow = { eu: string; us: string; uk: string; cm: string };

export function normalizeShoeSize(size: string) {
  const value = size.trim().replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(value) ? String(Number(value)) : value;
}

/** Preserve merchant measurements; missing conversions must not be guessed. */
export function completeShoeGuide(rows: ShoeGuideRow[], productSizes: string[] = []): ShoeGuideRow[] {
  const bySize = new Map(rows.map(row => [normalizeShoeSize(row.eu), { ...row, eu: normalizeShoeSize(row.eu) }]));
  const numeric = [...bySize.keys()].filter(size => /^\d+(?:\.\d+)?$/.test(size)).map(Number);
  const add = (size: string) => {
    const eu = normalizeShoeSize(size);
    if (eu && !bySize.has(eu)) bySize.set(eu, { eu, us: "—", uk: "—", cm: "—" });
  };
  if (numeric.length) {
    const min = Math.min(...numeric), max = Math.max(...numeric);
    if (max - min <= 100) {
      for (let half = Math.ceil(min * 2); half <= max * 2; half++) add(String(half / 2));
    }
  }
  productSizes.forEach(add);
  return [...bySize.values()].sort((a, b) => {
    const left = Number(a.eu), right = Number(b.eu);
    return Number.isFinite(left) && Number.isFinite(right) ? left - right : a.eu.localeCompare(b.eu, "en", { numeric: true });
  });
}

export const DEFAULT_SHOE_GUIDE = completeShoeGuide([
  { eu: "38", us: "6", uk: "5", cm: "24.0" },
  { eu: "39", us: "6.5", uk: "5.5", cm: "24.5" },
  { eu: "40", us: "7", uk: "6", cm: "25.0" },
  { eu: "41", us: "7.5", uk: "6.5", cm: "25.5" },
  { eu: "42", us: "8.5", uk: "7.5", cm: "26.5" },
  { eu: "43", us: "9.5", uk: "8.5", cm: "27.5" },
  { eu: "44", us: "10", uk: "9", cm: "28.0" },
  { eu: "45", us: "11", uk: "10", cm: "29.0" },
  { eu: "46", us: "12", uk: "11", cm: "30.0" },
]);
