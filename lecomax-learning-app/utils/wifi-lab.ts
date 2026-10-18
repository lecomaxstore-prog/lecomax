export function wifiLabUrl(value: string): string | null {
  try {
    const url = new URL(value.includes('://') ? value : `http://${value.includes(':') ? value : value + ':8081'}`);
    const ip = url.hostname.split('.').map(Number);
    const privateHost = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) && ip.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
      && (ip[0] === 10 || ip[0] === 192 && ip[1] === 168 || ip[0] === 172 && ip[1]! >= 16 && ip[1]! <= 31);
    if (!privateHost || url.protocol !== 'http:' || url.port !== '8081' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch { return null; }
}
