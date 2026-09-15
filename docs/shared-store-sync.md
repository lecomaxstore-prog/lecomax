# Website and app synchronization

The website dashboard owns store content in Supabase. The Expo application reads the same website API, rather than maintaining a second catalog. Production builds in `mobile/eas.json` target `https://lecomax.com`.

Both platforms read products, categories, promotions, banners and public settings. Catalog refresh runs every 30 seconds while active, on focus/reconnection, and through database change subscriptions when Supabase Realtime is available. Offline devices see previously fetched content until they reconnect. Platform-specific layout/settings remain platform-specific.

## Promotions

Manage product prices in Products and editorial product selections in Promotions. Active, unexpired promotion selections and products whose original price exceeds their current price appear in the promotions views. Featured products alone do not qualify. Disabling, deleting or expiring a selection removes its products unless they independently have a sale price. The same selector is used by website homepage/promotions and app home/catalog.

The promotion record's `discount_percent` is editorial metadata; it does not change checkout prices. Actual discounts must be reflected in product/variant prices, or configured as coupons. Checkout continues to use the authoritative server calculation.

Website category tiles now refresh from the API, honor managed images, show current product counts, and do not replace an empty/disabled category list with a bundled catalog. App banner/deep links to `/promotions` open the promotion-filtered catalog.

## Configuration

- Set `EXPO_PUBLIC_API_URL` to the website origin (without `/api`).
- Website `NEXT_PUBLIC_SUPABASE_URL` and mobile `EXPO_PUBLIC_SUPABASE_URL` must identify the same project. Mobile also needs that project's public anonymous key for authentication and Realtime. Never put the service-role key in Expo configuration.
- Local `mobile/app.config.ts` can inherit the public database configuration from the website's `.env.local`. Configure the equivalent public values in the EAS build environment for releases.
- Database content edits need no new application build after the connected client is installed. Changes to client code require a compatible Expo update or new app release; website code changes require deployment.

## Verification in this workspace

Local database configuration matches; the app API origin is `https://lecomax.com`. Read-only live requests returned HTTP 200 arrays from products (23), categories (4), promotions (0), banners (0), and settings (83). These counts are a point-in-time check, not fixtures. No customer or promotion records were created to test production.

Regression command: `node --test tests/store-promotions.test.ts tests/store-consistency.test.ts tests/commerce-pricing.test.ts tests/mobile-production-policy.test.ts`. Run the website and mobile TypeScript checks as well.

After deploying the reviewed website and mobile changes, open both, create an active promotion selecting a product in the dashboard, and check both promotion views within 30 seconds. Change category image/name, deactivate the category, and verify both views. Disable the promotion and verify its selection disappears unless the product still has a sale price. This interactive deployment acceptance check has not been performed; this change does not publish website or mobile releases.
