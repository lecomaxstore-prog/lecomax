import type { Metadata } from "next";

export const SITE_URL = "https://lecomax.com";
export const SITE_NAME = "L'ecomax";

/** Serialize editor-controlled data safely inside an application/ld+json script. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}

export function inferProductBrand(name: string, explicitBrand?: string | null): string | undefined {
  const cleanBrand = explicitBrand?.trim();
  if (cleanBrand) return cleanBrand;

  const knownBrands: Array<[RegExp, string]> = [
    [/\basics\b/i, "ASICS"],
    [/\blenovo\b/i, "Lenovo"],
    [/\bgenai\b/i, "GENAI"],
    [/\bbaasploa\b/i, "BAASPLOA"],
  ];
  return knownBrands.find(([pattern]) => pattern.test(name))?.[1];
}
