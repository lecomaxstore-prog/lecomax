# Cache Policy (Recommended)

## Static assets
Set long cache for versioned static files:
- CSS/JS/images/fonts: `Cache-Control: public, max-age=31536000, immutable`

Examples:
- `styles.css?v=2026-02-15`
- `app.js?v=2026-02-15`

## HTML pages
Set short/no cache:
- Marketing/content HTML (`index`, `about`, `newsroom`, etc.): `Cache-Control: no-cache, must-revalidate`
- Checkout/order-flow HTML (`checkout*`, `thank-you*`, `track-order`): `Cache-Control: no-store`

## API / dynamic endpoints
- `order.php`: `Cache-Control: no-store`

## Third-party hosted media
- External assets hosted on third-party origins (Dropbox, raw.githubusercontent.com, etc.) are controlled by their own cache headers.
- Keep critical UI assets local where possible for predictable cache behavior.

## CDN suggestions (Cloudflare)
- Enable Brotli compression
- Enable HTTP/2 and HTTP/3
- Cache static assets by file extension
- Bypass cache for `*.php`
- Set "Browser Cache TTL" for static assets to 1 year when versioned
- Use "Cache Everything" cautiously; exclude checkout/order routes

## Versioning strategy
When updating assets, change file name/version query:
- `styles.css?v=2026-02-15`
- `app.js?v=2026-02-15`

This ensures users get new files immediately while keeping strong caching.
