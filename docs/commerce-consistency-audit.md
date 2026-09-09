# Commerce consistency audit — 2026-09-08

Scope: existing Next.js site/admin/API, Expo client, Supabase migrations, notifications, assistant, cache and tests. Generated outputs, historical migration values, teaching examples and layout numbers are not live business sources.

## Existing sources and discrepancies found before implementation

| Value / rule | Existing consumers and discrepancy | Authoritative source / action |
| --- | --- | --- |
| Shipping | `lib/shipping-config.ts` default 40; initial SQL seed 35; latest migration 40; mobile cart independently defaults 40; website cart calculates locally; empty-city zones can override global rate | `settings` + `shipping_zones`, shared shipping resolver and server cart calculation |
| Free delivery | Global 500 with deliberate 1 MAD grace in shared helper; mobile cart requires exact threshold; zone thresholds can override global | Preserve grace compatibility, migrate carts to server quotes, add global enabled flag |
| Checkout pricing | `/api/checkout/quote` and `/api/orders` repeat coupon/loyalty/shipping/fee calculations; website uses local totals | One `calculateCart` domain service, both routes and both clients |
| Error handling | Orders ignored settings/zone read errors, then used fallback charges | Fail closed on authoritative read failures |
| Product/variant prices | DB `products.price`, `original_price`, encoded `__cprice` tags; duplicate mobile parser; static catalog snapshot for offline browsing | Keep existing schema, server reprice selected variants, share contracts/parser |
| Inventory | Existing transactional product locks/reservations and idempotency are sound; split cart lines can evade quote quantity check | Aggregate quote quantities; retain transaction recheck |
| Preorders | Per-product flags, no global switch | Global server gate plus existing product-specific approval/estimates |
| Coupon usage | Usage increment occurs AFTER successful order creation; last-use contention can still create discounted orders | Coupon lock/validation/consumption in the same order transaction |
| Order history | Unit prices/names snapshotted; shipping/discount/fees/taxes not durably stored as a breakdown | Add nullable JSON pricing snapshot, no invented legacy amounts |
| Low stock | Admin layout <=3; products <=5; stock screen browser-local threshold | One `low_stock_threshold` setting |
| Taxes | Checkout assumes included/zero; admin VAT invoice has separate calculations | Central tax configuration and calculation; historical invoice work must use purchase snapshot |
| Payments | Existing `payment_cod_*`, `payment_paypal_*` settings and admin controls | Reuse these; never create parallel COD fee keys |
| Minimum/maximum | Minimum enforced only in orders; no global maximum | Central validated limits, quote and order enforcement |
| Currency | MAD business denomination; mobile formatter rounds MAD to whole units; PayPal converts from MAD | Preserve MAD denomination; reject arbitrary relabeling; format minor units correctly. Additional currencies require a real conversion migration |
| Contact | `settings` exists, but public pages, email templates, support prompts and mobile fallbacks repeat phone/email | Use public settings for contact; preserve verified email sender configuration separately |
| Caches | Website settings memo has no periodic refresh; mobile staleTime alone doesn't poll; server shipping cache has no tag | Deduplicated refresh, cache tag invalidation, uncached checkout |
| Admin mutations | `/api/settings` verifies session, but arbitrary keys are accepted and financial validation accepts coercible null/booleans | Restrict editable keys, shared strict validation, origin/rate guards; preserve middleware role checks |
| Assistant | Smart assistant direct responses have no authoritative business context; support bot uses shipping context but hardcoded contact | Fresh configuration context and deterministic delivery/service answers |
| Banners/promotions | Existing DB endpoints; promotion labels and coupons are different concepts; catalog sale prices already live on products | Preserve editorial banners; use actual DB prices and coupon validity for amounts |

## Deployment and verification

Apply the additive `20260908120000_commerce_consistency.sql` migration before deploying the new order API. Without the RPC, checkout fails safely rather than creating partially accounted orders. Do not rewrite older migrations or historical orders. No production database writes or deployment have been performed by this audit.

Keep MAD and MA as the existing supported denomination/destination. Changing the currency label alone would corrupt the meaning of catalog amounts and PayPal conversion. This restriction is validated server-side.

Verification results and remaining limitations are recorded as implementation progresses.

## Verified follow-up changes

- Product guides now suggest 35 through 48 in half-size increments. Custom string sizes are accepted with every guide; existing string storage and inventory tags are preserved.
- Product and stock validation rejects null/boolean/blank coercion, duplicate option labels, and fractional minor-unit product prices. Shipping-zone money validation uses the same restrictions.
- The legacy shipping quote endpoint reads `loadCommerceConfiguration`, including the global free-shipping switch. Footer, category filters and mobile delivery information no longer maintain independent shipping defaults.
- Settings save only changed fields. Image autosave and maintenance toggles save only their own fields; unrelated edits stay unsaved. Failed image settings writes report failure. Mobile save actions sit above bottom navigation.
- Product and settings editors warn on reload and ordinary link navigation with unsaved changes. Product close actions also confirm. Browser-history interception is not implemented.
- Product saves recover from network errors and reject repeat submissions while saving/uploading.
- New products start hidden until explicitly activated. Existing product publication state is retained. Regenerating the color/size matrix preserves entered combination quantities.
- Assistant variant filtering uses the same selected-inventory resolver as checkout, including JSON color/size stock. Support, WhatsApp and reply-generation prompts load current store/payment/contact facts.

The reproducible candidate inventory is `docs/business-value-inventory.json`, generated with `node scripts/audit-business-values.mjs`. A match is not proof of a defect. Credentials, built output, teaching material and offline snapshot data are excluded. The source map above records the architectural findings; the inventory supplies individual file/line references.

## Expanded admin request: existing capabilities and outstanding work

| Area | Existing implementation | Outstanding requirement |
| --- | --- | --- |
| Mobile admin | Responsive drawer, bottom navigation, product/order mobile cards, sticky editor actions | Browser/device QA across all management screens |
| Catalog | Product CRUD, gallery/color images, descriptions/video, brands as text, category management | Relational brand/collection management and arbitrary option axes |
| Variants | String sizes, custom labels, color prices, per-color/per-size/per-combination stock | Independent combination price/SKU/barcode/cost/weight, custom HEX swatches and bulk variant operations |
| Inventory | Transactional inventory reservation, preorder lifecycle, central low-stock setting | Stock adjustment reasons/history and staging multi-connection contention tests |
| Store control | Settings, delivery zones, payment settings, mobile control section, app releases | Dedicated website control workspace; remote navigation and section ordering parity |
| Content | Existing banners, promotions, pages, announcements and categories | Verify scheduling and parity for every homepage consumer |
| Admin lists | Search/filtering and dashboard API exist | Product list currently loads all products; server pagination/global entity search remain |
| Historical communication | New orders store a pricing snapshot | Legacy invoice/VAT/notification views still contain fixed business text or inferred breakdowns; migrate them without inventing missing historical values |
| Contact/SEO | Central contact settings and updated support prompts | Several legal/contact pages and metadata still embed contact text; see candidate inventory |
| Security | Existing signed sessions, middleware permissions and mutation guards retained | Wider endpoint-by-endpoint authorization review remains |

This is an incremental implementation, not completion of every phase in the expanded request. No production migration, deployment, payment or customer notification was executed.

## Verification

- Real route tests with mocked I/O exercise admin settings authorization/validation, the shared website/mobile quote contract, shipping changes, tampered prices/totals, confirmed checkout, snapshots, decimal options and mobile retry behavior.
- Isolated PostgreSQL (PGlite) executes the existing migrations and commerce RPC: settings conflict rejection, snapshot preservation, coupon last-use enforcement, retry without double redemption, stock accounting and restricted RPC execution passed. PGlite serializes connections; this is not proof of production contention behavior.
- Full Node suite: 146 passed, 2 failed because existing mobile tests import `@/i18n` directly under Node without an alias loader (`mobile-navigation-intro`, `mobile-session-timeout`). These failures were present before these changes.
- Expo and website TypeScript checks passed. Ten Android back-controller scenarios passed. The targeted commerce/assistant/inventory suite passed all 29 tests. No visual browser/device acceptance test was run.
