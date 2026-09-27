const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  process.env.NODE_ENV === "development" ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com https://va.vercel-scripts.com https://www.googletagmanager.com https://widget.trustpilot.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com https://vitals.vercel-insights.com https://www.google-analytics.com https://*.google-analytics.com https://*.clarity.ms https://*.trustpilot.com",
  (process.env.NODE_ENV === "development" ? "frame-src 'self' " : "frame-src ") + "https://www.paypal.com https://www.sandbox.paypal.com https://*.trustpilot.com https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ").replace("script-src ", process.env.NODE_ENV === "development" ? "script-src 'unsafe-eval' " : "script-src ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  trailingSlash: true,
  // API requests throughout the app use extensionless, slashless URLs.
  // Let route handlers accept those URLs directly instead of issuing a 308
  // redirect, which can make browser fetches fail before reaching the handler.
  skipTrailingSlashRedirect: true,
  // Include source files in the dev-docs serverless function bundle (needed on Vercel)
  outputFileTracingIncludes: {
    "/api/admin/learning-assistant": ["./.source-library/catalog.json"],
    "/api/dev-docs/*": [
      "./.source-library/catalog.json",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 100],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
  devIndicators: false,
  async redirects() {
    return [
      // Fix 404: old .html pages that Googlebot crawled
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/authentication.html",
        destination: "/connexion/",
        permanent: true,
      },
      {
        source: "/terms.html",
        destination: "/conditions-utilisation/",
        permanent: true,
      },
      {
        source: "/confidentialite",
        destination: "/politique-confidentialite/",
        permanent: true,
      },
      {
        source: "/confidentialite/",
        destination: "/politique-confidentialite/",
        permanent: true,
      },
      // Fix 404: deleted/renamed products — redirect to closest category
      // Accessoires products
      {
        source: "/produit/a-mini-sac",
        destination: "/accessoires/",
        permanent: true,
      },
      {
        source: "/produit/a-mini-sac/",
        destination: "/accessoires/",
        permanent: true,
      },
      {
        source: "/produit/a-ecouteurs-sport",
        destination: "/accessoires/",
        permanent: true,
      },
      {
        source: "/produit/a-ecouteurs-sport/",
        destination: "/accessoires/",
        permanent: true,
      },
      // Homme products
      {
        source: "/produit/h-softshell",
        destination: "/homme/",
        permanent: true,
      },
      {
        source: "/produit/h-softshell/",
        destination: "/homme/",
        permanent: true,
      },
      {
        source: "/produit/h-veste-zip-tech",
        destination: "/homme/",
        permanent: true,
      },
      {
        source: "/produit/h-veste-zip-tech/",
        destination: "/homme/",
        permanent: true,
      },
      {
        source: "/produit/h-doudoune-hiver",
        destination: "/homme/",
        permanent: true,
      },
      {
        source: "/produit/h-doudoune-hiver/",
        destination: "/homme/",
        permanent: true,
      },
      // Chaussures products
      {
        source: "/produit/c-running-daily",
        destination: "/chaussures/",
        permanent: true,
      },
      {
        source: "/produit/c-running-daily/",
        destination: "/chaussures/",
        permanent: true,
      },
      {
        source: "/produit/c-trail-sport",
        destination: "/chaussures/",
        permanent: true,
      },
      {
        source: "/produit/c-trail-sport/",
        destination: "/chaussures/",
        permanent: true,
      },
      {
        source: "/produit/c-running-elite",
        destination: "/chaussures/",
        permanent: true,
      },
      {
        source: "/produit/c-running-elite/",
        destination: "/chaussures/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      ...(process.env.NODE_ENV === "development"
        ? [{
            source: "/admin/how-it-was-built/:path*",
            headers: [{ key: "Clear-Site-Data", value: '"cache"' }],
          }]
        : []),
      // ── Admin panel: no caching ────────────────────────────────────────────
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
      // ── Next.js static assets: long-lived immutable cache ─────────────────
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === "development"
              ? "no-store, no-cache, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      // Always let browsers discover the newest push worker. The worker does
      // not cache pages, but an old worker script can otherwise survive refreshes.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: process.env.NODE_ENV === "development" ? "SAMEORIGIN" : "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

module.exports = (phase) => ({
  webpack(config, { dev }) {
    if (dev) config.module.rules.push({
      test: /\.tsx$/,
      include: [require("node:path").join(__dirname, "app"), require("node:path").join(__dirname, "components")],
      enforce: "pre",
      use: [require.resolve("./scripts/source-inspector-loader.cjs")],
    });
    return config;
  },

  ...nextConfig,
  // Keep production builds from overwriting a running preview's chunks.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
