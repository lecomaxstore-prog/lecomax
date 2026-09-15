# Shared shoe-size conversions

Website API, size-guide page, product modal, and Expo guide use `mobile/src/lib/shoe-size-guide.ts`; `lib/shoe-size-guide.ts` re-exports it for website consumers. Saved `size_guide_shoes` measurements remain authoritative.

Missing values between measurements no more than one EU size apart are linearly interpolated and prefixed with `≈`. Example from the existing store chart: EU 44.5 shows approximately US 10.5, UK 9.5, and 28.5 cm. These are estimates from the store's chart, not manufacturer-verified conversions. US/UK estimates between standard half sizes show a range instead of inventing quarter-size labels. Missing measurements outside the chart or across wider gaps remain `—`.

Product-specific decimal sizes, including 44.4, are included. Comma decimals and equivalent forms (44,5 / 44.50) match the same row. Supplying a measured value in the dashboard overrides an estimate. Neither inventory nor the selectable product sizes are changed by this guide.

The API sends no-store responses. Open website modals follow store refresh events; the app guide refreshes every 30 seconds while open and is invalidated when settings change.

Validation: `node --test tests/shoe-size-conversions.test.ts tests/mobile-size-guide.test.ts`, plus website and Expo TypeScript checks. The updated helper also fills missing values from an older deployed size-guide API. Website/API publication and a compatible native client update are separate from committing these changes.
