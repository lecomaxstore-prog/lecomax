const PRODUCTION_API = 'https://lecomax.com';

// Local development overrides must never be bundled as the release API origin.
export function resolveApiOrigin(configured: string | undefined, development: boolean): string {
  return (development ? configured?.trim() || PRODUCTION_API : PRODUCTION_API).replace(/\/$/, '');
}
