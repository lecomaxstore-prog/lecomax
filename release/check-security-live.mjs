const base = 'https://lecomax.com';
for (const path of ['/', '/nouveautes', '/api/products?active=true&limit=2', '/api/admin/staff', '/api/dev-docs/tree', '/.env']) {
  const response = await fetch(base + path);
  const body = await response.text();
  console.log(JSON.stringify({path, status: response.status, bytes: body.length, nosniff: response.headers.get('x-content-type-options'), csp: !!response.headers.get('content-security-policy')}));
  if (path === '/' && response.ok) {
    const urls = [...body.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(match => match[1]);
    const css = (await Promise.all(urls.map(async url => (await fetch(new URL(url, base))).text()))).join('\n');
    console.log(JSON.stringify({salePriceCSS: /salePrice[^}]*#dc2626/.test(css), regularPriceCSS: /price[^}]*#203d2b/.test(css), newArrivals: body.includes('Nouveautés')}));
  }
}
