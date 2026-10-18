/** Server-side export contract; keep independent of the separately deployed Expo app. */
export type WebFiles = { html: string; css: string; javascript: string };

export function validWebFiles(value: unknown): value is WebFiles {
  if (!value || typeof value !== 'object') return false;
  const files = value as Record<string, unknown>;
  return Object.keys(files).length === 3 && ['html', 'css', 'javascript'].every(
    key => typeof files[key] === 'string' && (files[key] as string).length <= 20000,
  );
}
