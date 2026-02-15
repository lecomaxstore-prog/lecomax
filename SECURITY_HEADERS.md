# Security Headers (Production)

Use one of the following examples depending on your hosting stack.

## Recommended baseline
- Keep all pages on HTTPS only.
- Use HSTS only after HTTPS is fully stable on the domain/subdomains.
- Start CSP in `Content-Security-Policy-Report-Only` first, then enforce.
- This project currently uses Google Tag Manager, Tawk chat, Google Maps iframe, Dropbox video, and assets from `raw.githubusercontent.com`.

## Apache (`.htaccess`) example
```apache
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-site"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://embed.tawk.to https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; media-src 'self' https://www.dropbox.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://embed.tawk.to https://*.tawk.to https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com https://embed.tawk.to https://*.tawk.to https://maps.google.com;"
</IfModule>

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Nginx example
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-site" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://embed.tawk.to https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; media-src 'self' https://www.dropbox.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://embed.tawk.to https://*.tawk.to https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com https://embed.tawk.to https://*.tawk.to https://maps.google.com;" always;

# HTTPS redirect
if ($scheme != "https") {
  return 301 https://$host$request_uri;
}
```

## Notes
- Replace `'unsafe-inline'` in `script-src` with nonces/hashes when you move inline scripts to external files.
- If you add/remove third-party services, update CSP sources immediately.
- After enabling headers, smoke-test: homepage, shop/product flow, checkout pages, maps embed, and Tawk chat.
