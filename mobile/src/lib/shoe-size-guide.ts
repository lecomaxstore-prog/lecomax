export type ShoeGuideRow = { eu: string; us: string; uk: string; cm: string };

export function normalizeShoeSize(size: string) {
  const value = size.trim().replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(value) ? String(Number(value)) : value;
}

const missing = (value: string) => !value?.trim() || /^[—–-]$/.test(value.trim());
const measurement = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value?.trim()) ? Number(value.trim().replace(",", ".")) : NaN;

/** Preserve merchant measurements; mark interpolated conversions as estimates.
 * Never extrapolate beyond known measurements or bridge gaps larger than one EU size.
 */
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
  // Snapshot original anchors so estimates never become measurements themselves.
  const anchors = [...bySize.values()].map(row => ({ ...row })).sort((a, b) => Number(a.eu) - Number(b.eu));
  for (const row of bySize.values()) {
    const size = measurement(row.eu);
    if (!Number.isFinite(size)) continue;
    for (const column of ["us", "uk", "cm"] as const) {
      if (!missing(row[column])) continue;
      const measured = anchors.filter(anchor => Number.isFinite(measurement(anchor.eu)) && Number.isFinite(measurement(anchor[column])));
      const lower = measured.filter(anchor => Number(anchor.eu) < size).at(-1);
      const upper = measured.find(anchor => Number(anchor.eu) > size);
      if (!lower || !upper || Number(upper.eu) - Number(lower.eu) > 1) continue;
      const low = measurement(lower[column]), high = measurement(upper[column]);
      if (high < low) continue;
      const value = low + (high - low) * (size - Number(lower.eu)) / (Number(upper.eu) - Number(lower.eu));
      const rounded = Math.round(value * 100) / 100;
      // Avoid inventing US/UK quarter sizes: show the surrounding half-size range.
      const label = column === "cm" ? (Number.isInteger(rounded * 10) ? rounded.toFixed(1) : String(rounded))
        : Number.isInteger(rounded * 2) ? String(rounded) : `${Math.floor(rounded * 2) / 2}–${Math.ceil(rounded * 2) / 2}`;
      row[column] = `≈ ${label}`;
    }
  }
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
