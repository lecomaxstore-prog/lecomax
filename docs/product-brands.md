# Product brands

The product editor offers existing brands and an Add brand action. Upload an authentic PNG/JPG/WebP logo through the existing media uploader or supply an HTTPS image URL. Names without logos and failed logo downloads display a text fallback.

`GET /api/products/brands` is public. `POST` uses the existing product-create authorization, same-origin validation and rate limits. Brands are stored individually in the existing settings table under `product_brand:<sha256(normalized-name)>`; no schema migration is required. Case and whitespace variants share an identity. Saving the same name updates its logo. Existing product brand strings remain compatible and appear in the admin selector.

The bundled ASICS logo was downloaded from https://corp3.asics.com/system/assets/logo-asics.svg, referenced by https://corp3.asics.com/en/focus/ip/brand, on 2026-10-18. The SVG is retained for admin display; the Expo PNG is a raster conversion of that official asset, not a recreated logo.

For local Expo web preview with the Next API on port 3000, start Metro with `EXPO_BRANDS_PROXY_TARGET=http://127.0.0.1:3000`. Other API requests retain their configured upstream. Native devices need an API host they can reach with the new route. Production requires deployment of the Next route and an updated mobile bundle; local changes do not publish either.

The shared default catalogue now includes all 30 Expo bundled brands. Public PNG files are byte-identical copies of the Expo artwork; admin selection and website product details use this catalogue and the same saved registry overrides. Source attribution remains in mobile/assets/images/brands/SOURCES.md.
