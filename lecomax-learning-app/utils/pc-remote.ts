export function pcRemoteUrl(value: string): string | null {
  try {
    const url = new URL(value.includes('://') ? value : `http://${value.includes(':') ? value : value + ':6081'}`);
    const p = url.hostname.split('.').map(Number);
    const privateHost = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) && p.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
      && (p[0] === 10 || p[0] === 192 && p[1] === 168 || p[0] === 172 && p[1]! >= 16 && p[1]! <= 31 || p[0] === 100 && p[1]! >= 64 && p[1]! <= 127);
    const local = privateHost && url.protocol === 'http:' && url.port === '6081';
    // A public connection must terminate at an authenticated HTTPS gateway. The
    // host agent still needs a deployed signaling/relay service; accepting the
    // URL here never turns the local VNC bridge into an internet service.
    const remote = url.protocol === 'https:' && (!url.port || url.port === '443');
    if ((!local && !remote) || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch { return null; }
}
