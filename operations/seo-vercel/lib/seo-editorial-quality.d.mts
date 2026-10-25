export const EDITORIAL_REVISION: 3;
export const DEFAULT_EDITORIAL_TIER: 'editorial-sol';
export const EDITORIAL_LIMITS: Readonly<Record<string, [number, number]>>;
export const EDITORIAL_PROMPT: string;
export function normalizedText(value: unknown): string;
export function characterCount(value: unknown): number;
export function editorialIdentity(source: { brand?: string | null; model?: string | null }): string[];
export function assessEditorial(bundle: unknown, source: { name?: string; brand?: string | null; model?: string | null; category?: string | null; description?: string | null }, corpus?: unknown[]): { valid: boolean; errors: string[]; warnings: string[]; lengths: Record<string, Record<string, number>>; humanReviewRequired: boolean };
