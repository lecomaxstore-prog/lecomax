// Persist only known routes and non-secret parameters, never pairing/login links.
const staticRoutes = new Set(['/', '/teacher', '/project', '/path', '/more', '/phone', '/pc', '/settings', '/search', '/my-site', '/mission', '/knowledge', '/kali', '/terminal', '/change-history', '/wellness', '/wellness/progress', '/wellness/preferences', '/wellness/notifications']);
export function resumeRoute(path: string, params: Record<string, unknown> = {}): string | null {
  if (params.pair || params.invite) return null;
  if (path === '/interactive-studio') return path;
  if (path === '/memory-studio') return path;
  if (path === '/learning-journey' && typeof params.id === 'string' && /^plan-[a-z0-9-]+$/.test(params.id)) return '/learning-journey?id=' + params.id;
  if (path === '/tutor') return path;
  if (['/explore', '/discover', '/my-learning', '/learning', '/profile', '/account', '/practice', '/practice-lab', '/onboarding'].includes(path)) return path;
  if (path === '/study-plan' && typeof params.id === 'string' && /^plan-[a-z0-9-]+$/.test(params.id)) return '/study-plan?id=' + params.id;
  if (path === '/plan-lesson' && typeof params.plan === 'string' && /^plan-[a-z0-9-]+$/.test(params.plan) && typeof params.step === 'string' && /^[0-5]$/.test(params.step)) return '/plan-lesson?plan=' + params.plan + '&step=' + params.step;
  if (staticRoutes.has(path)) return path;
  if (/^\/(lesson|module|course|learning-path|collection|definition)\/[^/?#]{1,200}$/.test(path)) return path;
  if (path === '/file' && typeof params.path === 'string' && params.path.length < 500) {
    return '/file?path=' + encodeURIComponent(params.path) + (typeof params.line === 'string' && /^\d{1,6}$/.test(params.line) ? '&line=' + params.line : '');
  }
  return null;
}
export function savedResumeRoute(value: string | null): string | null {
  if (!value || value.length > 2000) return null;
  try {
    const url = new URL(value, 'https://resume.invalid');
    if (url.origin !== 'https://resume.invalid' || url.hash) return null;
    const checked = resumeRoute(url.pathname, Object.fromEntries(url.searchParams));
    return checked === value ? checked : null;
  } catch { return null; }
}
