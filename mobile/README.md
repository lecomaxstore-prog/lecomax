# Lecomax Mobile

Premium Expo SDK 57 application for Android, iOS and web. The app reads the same Supabase tables as the Lecomax admin dashboard and subscribes to realtime catalog changes.

## Run

1. Copy `.env.example` to `.env` and set the existing public Supabase URL/key.
2. Run `npm install`.
3. Run `npm start` for Expo, or `npm run web`.

The catalog remains usable without credentials through a small offline fallback set. Authentication tokens use iOS Keychain / Android Keystore through Expo Secure Store. Catalog queries, cart, wishlist, preferences, recent products and search history persist locally.

## Architecture

- `src/app`: Expo Router routes, tabs and deep-link destinations
- `src/components`: reusable native commerce primitives
- `src/services`: backend boundary for catalog, orders and notifications
- `src/stores`: persistent Zustand client state
- `src/hooks`: React Query hooks
- `src/types`: backend-facing domain models

Backend writes stay in the existing dashboard. Products, categories and promotions are refreshed through Supabase Realtime; orders are inserted into the existing `orders` table.
