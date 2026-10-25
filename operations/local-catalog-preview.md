# Local public catalog preview

Run `node scripts/dev-public-catalog.cjs` from the repository root, then open
http://localhost:3000. Use `node scripts/dev-public-catalog.cjs --refresh` to
download a fresh copy of the published catalog before starting.

The launcher reads the unauthenticated public products API and saves a snapshot
in `artifacts/local-public-catalog/catalog.json`. It serves catalog reads on
127.0.0.1:54321 and starts Next development mode on 127.0.0.1:3000. Both ports
must be free. Stop it with Ctrl+C.

This is a catalog preview, not a full local Supabase instance. Product listings,
detail pages, images and search use real public product data as of the snapshot
timestamp. Prices and stock do not update until the snapshot is refreshed.
Optional reviews, promotions and settings use empty local responses/defaults.
Unsupported services fail explicitly. Account, checkout and inventory writes
are rejected; there is no production database connection. Environment files
are not modified, and their credentials are excluded from the preview process.

Production application source and environment isolation rules are unchanged.
Do not use this launcher to validate purchases, authentication or deployments.
