/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 100],
    minimumCacheTTL: 31536000, // 1 year
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
        destination: "/connexion",
        permanent: true,
      },
      // Fix 404: deleted/renamed products — redirect to closest category
      {
        source: "/produit/a-mini-sac",
        destination: "/accessoires",
        permanent: true,
      },
      {
        source: "/produit/a-mini-sac/",
        destination: "/accessoires",
        permanent: true,
      },
      {
        source: "/produit/a-ecouteurs-sport",
        destination: "/accessoires",
        permanent: true,
      },
      {
        source: "/produit/a-ecouteurs-sport/",
        destination: "/accessoires",
        permanent: true,
      },

    ];
  },
  async headers() {
    return [
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
