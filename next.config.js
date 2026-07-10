/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  trailingSlash: true,
  // Include source files in the dev-docs serverless function bundle (needed on Vercel)
  outputFileTracingIncludes: {
    "/api/dev-docs/*": [
      "./app/**/*",
      "./components/**/*",
      "./lib/**/*",
      "./scripts/**/*",
      "./public/**/*.{txt,json,js,svg}",
      "./*.{js,ts,json,md}",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 100],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
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
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Tell Google not to index raw image files as web pages
        source: "/images/:path*.(avif|webp|png|jpg|jpeg|gif|svg)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
