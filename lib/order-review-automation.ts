import "server-only";

export const REVIEW_AUTOMATION_KEY_PREFIX = "order_review_automation:";
export const REVIEW_FOLLOWUP_DELAY_MS = 2 * 24 * 60 * 60 * 1000;

export type ReviewAutomationState = {
  orderId: string;
  deliveredAt: string;
  followupDueAt: string;
  productReviewSentAt: string | null;
  followupSentAt: string | null;
  processingAt?: string | null;
  lastError?: string | null;
};

export type ReviewOrderItem = {
  slug?: string;
  name: string;
  image?: string;
  qty?: number;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com").replace(/\/$/, "");

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function absoluteImage(src?: string) {
  if (!src) return `${siteUrl}/images/email%20image/email%20image.png`;
  return src.startsWith("http") ? src : `${siteUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}

function productReviewUrl(slug: string | undefined, email: string) {
  if (!slug) return `${siteUrl}/boutique`;
  return `${siteUrl}/produit/${encodeURIComponent(slug)}?review=1&email=${encodeURIComponent(email)}#avis`;
}

function emailShell(content: string, preview: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>L'ecomax</title>
  <style>@media(max-width:600px){.wrap{padding:16px!important}.card{border-radius:16px!important}.pad{padding:26px 20px!important}.product{display:block!important;width:100%!important}.product-img{width:72px!important;height:72px!important}.cta{display:block!important;text-align:center!important}}</style></head>
  <body style="margin:0;background:#f3f4f3;font-family:Arial,Helvetica,sans-serif;color:#111"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f3"><tr><td class="wrap" align="center" style="padding:36px 16px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="card" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden">
  <tr><td style="background:#0b0d0b;padding:24px 30px"><span style="font-size:23px;font-weight:900;color:#fff">L'eco<span style="color:#3ecf4c">max</span></span><span style="float:right;padding-top:7px;font-size:9px;font-weight:700;letter-spacing:1.6px;color:#7b827c">PERFORMANCE &amp; STYLE</span></td></tr>
  ${content}
  <tr><td style="border-top:1px solid #edf0ed;padding:20px 28px;text-align:center;font-size:11px;line-height:1.7;color:#8b918c">Une question ? Répondez simplement à cet e-mail.<br><a href="${siteUrl}" style="color:#239f37;text-decoration:none;font-weight:700">lecomax.com</a> · Retours sous 30 jours</td></tr>
  </table></td></tr></table></body></html>`;
}

export function buildProductReviewEmailHtml(args: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: ReviewOrderItem[];
}) {
  const firstName = escapeHtml(args.customerName.split(" ")[0] || "Client");
  const products = args.items.slice(0, 4).map((item) => {
    const url = productReviewUrl(item.slug, args.customerEmail);
    return `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8ebe8;border-radius:14px"><tr>
      <td style="width:82px;padding:10px"><img class="product-img" src="${escapeHtml(absoluteImage(item.image))}" alt="" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:10px;background:#f5f5f5"></td>
      <td style="padding:12px 8px;font-size:13px;font-weight:700;line-height:1.4;color:#202420">${escapeHtml(item.name)}</td>
      <td style="padding:12px 14px;text-align:right"><a href="${escapeHtml(url)}" style="display:inline-block;border:1px solid #dfe3df;border-radius:9px;padding:10px 12px;color:#111;font-size:10px;font-weight:800;text-decoration:none;white-space:nowrap">Donner mon avis</a></td>
    </tr></table></td></tr>`;
  }).join("");

  return emailShell(`<tr><td class="pad" style="padding:38px 36px 32px">
    <div style="display:inline-block;border-radius:999px;background:#ecfdf0;padding:7px 11px;color:#17852d;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Commande livrée</div>
    <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.15;letter-spacing:-.7px">Tout est bien arrivé, ${firstName} ?</h1>
    <p style="margin:0 0 8px;color:#626963;font-size:14px;line-height:1.65">Votre commande <strong style="color:#111">#${escapeHtml(args.orderNumber)}</strong> est indiquée comme livrée.</p>
    <p style="margin:0 0 26px;color:#626963;font-size:14px;line-height:1.65">Votre retour aide les prochains clients à choisir et nous permet d'améliorer chaque produit.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${products}</table>
    <p style="margin:16px 0 0;padding:14px 16px;border-radius:12px;background:#f7f8f7;color:#747a75;font-size:11px;line-height:1.55">Vous recevrez un unique rappel dans 2 jours si vous n'avez pas encore partagé votre expérience.</p>
  </td></tr>`, `Votre commande #${args.orderNumber} est livrée. Partagez votre avis produit.`);
}

export function buildTrustpilotFollowupEmailHtml(customerName: string, orderNumber: string) {
  const firstName = escapeHtml(customerName.split(" ")[0] || "Client");
  const reviewUrl = "https://www.trustpilot.com/evaluate/lecomax.com";
  return emailShell(`<tr><td class="pad" style="padding:40px 36px 34px;text-align:center">
    <div style="font-size:30px;letter-spacing:3px;color:#00b67a">★★★★★</div>
    <h1 style="margin:18px 0 10px;font-size:27px;line-height:1.18;letter-spacing:-.6px">Un dernier petit mot, ${firstName}</h1>
    <p style="margin:0 auto 26px;max-width:460px;color:#626963;font-size:14px;line-height:1.7">Deux jours se sont écoulés depuis la livraison de la commande <strong style="color:#111">#${escapeHtml(orderNumber)}</strong>. Si tout s'est bien passé, votre avis public aide énormément notre équipe et les futurs clients.</p>
    <a class="cta" href="${reviewUrl}" style="display:inline-block;border-radius:11px;background:#00b67a;padding:15px 24px;color:#fff;font-size:13px;font-weight:800;text-decoration:none">Partager mon expérience sur Trustpilot</a>
    <p style="margin:22px 0 0;color:#9aa09b;font-size:10px;line-height:1.5">Ce rappel est envoyé une seule fois après votre livraison.</p>
  </td></tr>`, `Votre expérience avec L'ecomax compte — un rappel unique après livraison.`);
}

export function initialReviewAutomationState(orderId: string, deliveredAt = new Date()) : ReviewAutomationState {
  return {
    orderId,
    deliveredAt: deliveredAt.toISOString(),
    followupDueAt: new Date(deliveredAt.getTime() + REVIEW_FOLLOWUP_DELAY_MS).toISOString(),
    productReviewSentAt: null,
    followupSentAt: null,
    processingAt: null,
    lastError: null,
  };
}

export function parseReviewAutomationState(value: unknown): ReviewAutomationState | null {
  try {
    const state = typeof value === "string" ? JSON.parse(value) : value;
    return state && typeof state === "object" && typeof state.orderId === "string" ? state as ReviewAutomationState : null;
  } catch {
    return null;
  }
}
