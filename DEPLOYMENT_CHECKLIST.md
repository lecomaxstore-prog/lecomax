# Lecomax Deployment Checklist

## 1) Environment & Secrets
- [ ] Set `LECOMAX_SMTP_PASS` in server environment.
- [ ] Set `TURNSTILE_SECRET_KEY` in server environment.
- [ ] Verify no secrets are hardcoded in frontend files.
- [ ] Confirm PHP mail dependencies are available in production.

## 2) Domain & SEO
- [x] `robots.txt` exists.
- [x] `sitemap.xml` exists.
- [x] Canonical tags added across pages.
- [x] `meta description` and `meta robots` added across pages.
- [x] Open Graph and Twitter tags are now standardized across all HTML pages.
- [ ] Submit sitemap to Google Search Console.
- [ ] Verify domain property in Google Search Console and Bing Webmaster Tools.

## 3) Security
- [x] Checkout anti-bot hardening implemented (frontend + backend).
- [x] Cloudflare Turnstile integrated in checkout pages.
- [x] Cookie consent with Consent Mode integrated.
- [x] External links with `target="_blank"` hardened using `rel="noopener noreferrer"` on homepage.
- [ ] Enable HTTP security headers on server/CDN (see `SECURITY_HEADERS.md`).
- [ ] Force HTTPS and redirect all HTTP traffic.
- [ ] Restrict `order.php` to expected methods and trusted origins in production.

## 4) Performance
- [x] Global reduced-motion and accessibility improvements applied.
- [x] Lazy loading and input enhancements added in shared scripts.
- [x] Homepage lazy-loading/decoding hints and network preconnect/dns-prefetch applied.
- [x] `content-visibility` optimization applied to below-the-fold sections.
- [ ] Enable Brotli/Gzip compression at server/CDN.
- [ ] Add long-cache policy for static assets with versioning.
- [ ] Run Lighthouse on homepage, product page, checkout.

## 5) Functional QA (manual)
- [ ] Add to cart / remove / quantity update.
- [ ] Product options (color/size) selection.
- [ ] Checkout submit success path.
- [ ] Checkout anti-spam/Turnstile failure path.
- [ ] Thank-you pages (EN/FR/AR).
- [ ] Language switch behavior across key pages.
- [x] Broken internal links in `lecomax.com` homepage/footer resolved.
- [ ] WhatsApp and support links.

## 6) Analytics & Consent QA
- [ ] Confirm analytics is denied by default before consent.
- [ ] Confirm analytics updates to granted only after accept.
- [ ] Validate events in GA DebugView after consent.

## 7) Final Launch Steps
- [ ] Backup current live version.
- [ ] Deploy to staging, run full QA checklist.
- [ ] Deploy to production.
- [ ] Verify real-time logs for `order.php` errors (first 24h).
- [ ] Monitor conversion funnel and checkout completion rate.
- [ ] Verify response headers in production (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`).
- [ ] Re-submit updated sitemap after deployment if URL set changed.

---

## Quick smoke-test URLs
- `/shop.html`
- `/product.html`
- `/checkout.html`
- `/checkout-fr.html`
- `/checkout-ar.html`
- `/thank-you.html`
- `/track-order.html`
- `/help-center.html`
