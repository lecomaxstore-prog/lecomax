# Lecomax Mobile

Premium Expo SDK 57 application for Android, iOS and web. The app reads the website API at `EXPO_PUBLIC_API_URL` (production: `https://lecomax.com`). The API and dashboard use the same Supabase database.

## Run

1. Copy `.env.example` to `.env` and set the existing public Supabase URL/key.
2. Run `npm install`.
3. Run `npm start` for Expo, or `npm run web`.

Previously fetched public catalog data remains available offline. New catalog reads use the live API, without a bundled catalog fallback. Authentication tokens use iOS Keychain / Android Keystore through Expo Secure Store. Catalog queries, cart, wishlist, preferences, recent products and search history persist locally.

## Architecture

- `src/app`: Expo Router routes, tabs and deep-link destinations
- `src/components`: reusable native commerce primitives
- `src/services`: backend boundary for catalog, orders and notifications
- `src/stores`: persistent Zustand client state
- `src/hooks`: React Query hooks
- `src/types`: backend-facing domain models

Store content is managed in the existing website dashboard. Products, categories, promotions, banners and settings refresh through Supabase Realtime where enabled, with a 30-second polling fallback and refresh on returning to the app. Orders and checkout use the website API. See [shared store synchronization](../docs/shared-store-sync.md) for setup and verification.
