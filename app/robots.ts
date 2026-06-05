import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/panier", "/compte/", "/merci"],
      },
    ],
    sitemap: "https://lecomax.com/sitemap.xml",
    host: "https://lecomax.com",
  };
}
