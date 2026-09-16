export type NewsletterProduct = {
  slug: string;
  name: string;
  price: number;
  original_price?: number | null;
  images?: string[] | null;
};

export type NewsletterCampaign = {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  sectionTitle: string;
  heroImage: string;
  ctaBackground: string;
  ctaTextColor: string;
  ctaRadius: string;
};

const SITE_URL = "https://lecomax.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}

function absoluteUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value, SITE_URL);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch { return fallback; }
}

export function buildNewsletterEmail(campaign: NewsletterCampaign, products: NewsletterProduct[]) {
  const heroImage = absoluteUrl(campaign.heroImage, `${SITE_URL}/ecomax-hero-banner.jpg.png`);
  const productCards = products.slice(0, 12).map((product) => {
    const image = absoluteUrl(product.images?.[0], `${SITE_URL}/favicon.png`);
    const href = `${SITE_URL}/produit/${encodeURIComponent(product.slug)}`;
    const discount = product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100) : 0;
    return `<td width="33.33%" valign="top" style="padding:7px">
      <a href="${href}" style="color:#111;text-decoration:none">
        <img class="product-image" src="${image}" alt="${escapeHtml(product.name)}" width="176" style="display:block;width:100%;height:176px;object-fit:cover;border-radius:8px;background:#f4f4f4">
        <p style="margin:10px 0 5px;font-size:13px;line-height:1.35;font-weight:700">${escapeHtml(product.name)}</p>
        <p style="margin:0;font-size:15px;font-weight:900">${product.price.toFixed(0)} MAD ${discount ? `<span style="font-size:11px;color:#dc2626;font-weight:700">-${discount}%</span>` : ""}</p>
      </a>
    </td>`;
  });
  const productGrid = Array.from({ length: Math.ceil(productCards.length / 3) }, (_, row) =>
    `<tr>${productCards.slice(row * 3, row * 3 + 3).join("")}${"<td width=\"33.33%\"></td>".repeat(3 - productCards.slice(row * 3, row * 3 + 3).length)}</tr>`,
  ).join("");
  const productRows = products.length ? `
    <tr><td style="padding:30px 22px 10px"><h2 style="margin:0;font-size:24px;line-height:1.2;color:#111">${escapeHtml(campaign.sectionTitle)}</h2></td></tr>
    <tr><td style="padding:8px 14px 26px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${productGrid}</table>
    </td></tr>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>@media(max-width:620px){.shell{width:100%!important}.pad{padding-left:22px!important;padding-right:22px!important}.hero-title{font-size:30px!important}.product-image{height:auto!important}}</style></head>
  <body style="margin:0;background:#f3f4f2;font-family:Arial,sans-serif;color:#111">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(campaign.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f2"><tr><td align="center" style="padding:24px 10px">
      <table class="shell" role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#fff">
        <tr><td align="center" style="padding:20px"><img src="${SITE_URL}/images/lecomax%20logo.png" width="150" alt="L'ecomax" style="display:block;max-height:48px;object-fit:contain"></td></tr>
        <tr><td><img src="${heroImage}" width="600" alt="Sélection L'ecomax" style="display:block;width:100%;height:250px;object-fit:cover"></td></tr>
        <tr><td class="pad" style="padding:30px 34px 12px">
          <p style="margin:0 0 10px;color:#16a34a;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase">${escapeHtml(campaign.eyebrow)}</p>
          <h1 class="hero-title" style="margin:0 0 14px;font-size:38px;line-height:1.08;letter-spacing:0">${escapeHtml(campaign.heading)}</h1>
          <p style="margin:0;color:#555;font-size:15px;line-height:1.7">${escapeHtml(campaign.body).replace(/\n/g, "<br>")}</p>
        </td></tr>
        <tr><td class="pad" style="padding:18px 34px 24px"><a href="${absoluteUrl(campaign.ctaUrl, SITE_URL)}" style="display:block;padding:15px 22px;background:${campaign.ctaBackground};color:${campaign.ctaTextColor};text-align:center;text-decoration:none;font-size:14px;font-weight:900;border-radius:${campaign.ctaRadius}px">${escapeHtml(campaign.ctaLabel)}</a></td></tr>
        ${productRows}
        <tr><td style="padding:26px 24px;background:#0b0d0b;color:#fff;text-align:center"><p style="margin:0 0 7px;font-size:13px;font-weight:800">L'ECOMAX · MARKETPLACE LIFESTYLE</p><p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6">Livraison partout au Maroc · Retours sous 30 jours<br>Vous recevez cet email car vous êtes inscrit(e) à notre newsletter.</p></td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
