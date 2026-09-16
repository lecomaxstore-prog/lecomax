// Public, crawler-safe alias for Google Merchant Center. The legacy API URL
// remains available for compatibility, while this path is outside /api/ and
// therefore not blocked by the site's crawler rules.
export { GET, revalidate } from "@/app/api/feed/products.xml/route";
