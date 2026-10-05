import { RETURN_POLICY } from "./return-policy.ts";
import "server-only";

export const REVIEW_AUTOMATION_KEY_PREFIX = "order_review_automation:";
export const REVIEW_FOLLOWUP_DELAY_MS = 2 * 24 * 60 * 60 * 1000;

export type ReviewAutomationState = {
  orderId: string;
  deliveredAt: string;
  followupDueAt: string;
  productReviewSentAt: string | null;
  followupSentAt: string | null;
  productWhatsAppSentAt?: string | null;
  followupWhatsAppSentAt?: string | null;
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

export function productReviewUrl(slug: string | undefined, _email = "", orderNumber = "") {
  if (!slug) return `${siteUrl}/boutique`;
  return `${siteUrl}/produit/${encodeURIComponent(slug)}?review=1&order=${encodeURIComponent(orderNumber)}#avis`;
}

export function buildProductReviewWhatsAppText(args: {
  customerName: string;
  customerEmail?: string;
  orderNumber: string;
  items: ReviewOrderItem[];
}) {
  const firstName = args.customerName.split(" ")[0] || "Client";
  const links = args.items.slice(0, 5).map((item, index) =>
    `${index + 1}. ${item.name}\n${productReviewUrl(item.slug, args.customerEmail || "", args.orderNumber)}`
  ).join("\n\n");
  return `Bonjour ${firstName},\n\nVotre commande #${args.orderNumber} a bien été livrée. Nous espérons que vos articles vous plaisent.\n\nPartagez votre avis sur les produits achetés :\n\n${links || `${siteUrl}/boutique`}\n\nVotre retour aide les autres clients à choisir et nous permet de mieux vous servir. Merci pour votre confiance.\n\nL'équipe L'ecomax`;
}

export function buildTrustpilotWhatsAppText(customerName: string, orderNumber: string) {
  const firstName = customerName.split(" ")[0] || "Client";
  return `Bonjour ${firstName},\n\nNous espérons que vous êtes pleinement satisfait(e) de votre commande #${orderNumber}.\n\nVotre expérience compte beaucoup pour nous. En partageant un avis sincère sur Trustpilot, vous aidez d'autres clients à faire leur choix et notre équipe à continuer d'améliorer la qualité de ses services.\n\nPartager mon expérience :\nhttps://www.trustpilot.com/evaluate/lecomax.com\n\nCela ne prend que quelques instants. Chaque retour est lu avec attention par notre équipe.\n\nMerci d'avoir choisi L'ecomax et de nous accorder votre confiance.\n\nBien cordialement,\nL'équipe Expérience Client L'ecomax`;
}

function emailShell(content: string, preview: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>L'ecomax</title>
  <style>@media(max-width:600px){.wrap{padding:0!important}.card{border-radius:0!important;border-left:0!important;border-right:0!important}.pad{padding:28px 20px!important}.brand-pad{padding:20px!important}.product-img{width:68px!important;height:68px!important}.cta{display:block!important;text-align:center!important;padding-left:14px!important;padding-right:14px!important}}</style></head>
  <body style="margin:0;background:#f3f4f3;font-family:Arial,Helvetica,sans-serif;color:#111"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f3"><tr><td class="wrap" align="center" style="padding:36px 16px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="card" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden">
  <tr><td class="brand-pad" style="background:#0b0d0b;padding:24px 30px"><span style="font-size:23px;font-weight:900;color:#fff">L'eco<span style="color:#3ecf4c">max</span></span><span style="float:right;padding-top:7px;font-size:9px;font-weight:700;letter-spacing:1.6px;color:#a1a7a2">MAROC</span></td></tr>
  ${content}
  <tr><td style="border-top:1px solid #edf0ed;padding:20px 28px;text-align:center;font-size:11px;line-height:1.7;color:#8b918c">Une question ? Répondez simplement à cet e-mail.<br><a href="${siteUrl}" style="color:#239f37;text-decoration:none;font-weight:700">lecomax.com</a> · ${RETURN_POLICY.summary}</td></tr>
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
    const url = productReviewUrl(item.slug, args.customerEmail, args.orderNumber);
    return `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8ebe8;border-radius:14px"><tr>
      <td style="width:82px;padding:10px"><img class="product-img" src="${escapeHtml(absoluteImage(item.image))}" alt="" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:10px;background:#f5f5f5"></td>
      <td style="padding:12px 14px 12px 8px;font-size:13px;font-weight:700;line-height:1.4;color:#202420">${escapeHtml(item.name)}${item.qty && item.qty > 1 ? `<br><span style="font-size:10px;font-weight:500;color:#8b918c">Quantité : ${item.qty}</span>` : ""}</td>
    </tr><tr><td colspan="2" style="padding:0 10px 10px"><a class="cta" href="${escapeHtml(url)}" style="display:block;border-radius:9px;background:#111;padding:11px 14px;color:#fff;font-size:11px;font-weight:800;text-align:center;text-decoration:none">Donner mon avis sur ce produit</a></td></tr></table></td></tr>`;
  }).join("");

  return emailShell(`<tr><td class="pad" style="padding:38px 36px 32px">
    <div style="display:inline-block;border-radius:999px;background:#ecfdf0;padding:7px 11px;color:#17852d;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Commande livrée</div>
    <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2">Votre commande est arrivée, ${firstName}</h1>
    <p style="margin:0 0 8px;color:#626963;font-size:14px;line-height:1.65">La commande <strong style="color:#111">#${escapeHtml(args.orderNumber)}</strong> est maintenant indiquée comme livrée.</p>
    <p style="margin:0 0 26px;color:#626963;font-size:14px;line-height:1.65">Prenez un instant pour noter les articles reçus. Votre retour aide les autres clients à choisir et notre équipe à mieux vous servir.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${products}</table>
    <p style="margin:16px 0 0;padding:14px 16px;border-radius:10px;background:#f7f8f7;color:#747a75;font-size:11px;line-height:1.55">Chaque bouton ouvre directement la fiche du produit concerné. Aucun compte supplémentaire n'est nécessaire.</p>
  </td></tr>`, `Votre commande #${args.orderNumber} est livrée. Partagez votre avis produit.`);
}

export function buildTrustpilotFollowupEmailHtml(customerName: string, orderNumber: string) {
  const firstName = escapeHtml(customerName.split(" ")[0] || "Client");
  const reviewUrl = "https://www.trustpilot.com/evaluate/lecomax.com";
  return emailShell(`<tr><td class="pad" style="padding:40px 36px 34px;text-align:center">
    <div style="font-size:30px;letter-spacing:3px;color:#00b67a">★★★★★</div>
    <h1 style="margin:18px 0 10px;font-size:27px;line-height:1.2">Comment s'est passée votre expérience, ${firstName} ?</h1>
    <p style="margin:0 auto 26px;max-width:460px;color:#626963;font-size:14px;line-height:1.7">Nous espérons que vous profitez pleinement de la commande <strong style="color:#111">#${escapeHtml(orderNumber)}</strong>. Un avis honnête sur votre expérience L'ecomax aide les futurs clients et notre équipe.</p>
    <a class="cta" href="${reviewUrl}" style="display:inline-block;border-radius:11px;background:#00b67a;padding:15px 24px;color:#fff;font-size:13px;font-weight:800;text-decoration:none">Partager mon expérience sur Trustpilot</a>
    <p style="margin:22px 0 0;color:#9aa09b;font-size:10px;line-height:1.5">Cette invitation est envoyée une seule fois. Merci pour votre confiance.</p>
  </td></tr>`, `Votre expérience avec L'ecomax compte — un rappel unique après livraison.`);
}

export function buildProductReviewFollowupEmailHtml(args: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: ReviewOrderItem[];
}) {
  const firstName = escapeHtml(args.customerName.split(" ")[0] || "Client");
  const trustpilotUrl = "https://www.trustpilot.com/evaluate/lecomax.com";
  const products = args.items.slice(0, 6).map((item) => {
    const url = productReviewUrl(item.slug, args.customerEmail, args.orderNumber);
    return `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e9e6;border-radius:14px;background:#fff"><tr>
      <td style="width:82px;padding:10px"><img class="product-img" src="${escapeHtml(absoluteImage(item.image))}" alt="${escapeHtml(item.name)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:10px;background:#f5f5f5"></td>
      <td style="padding:12px 14px 12px 8px"><p style="margin:0;font-size:13px;font-weight:800;line-height:1.4;color:#171a17">${escapeHtml(item.name)}</p>${item.qty && item.qty > 1 ? `<p style="margin:5px 0 0;font-size:10px;color:#8b918c">Quantité : ${item.qty}</p>` : ""}</td>
    </tr><tr><td colspan="2" style="padding:0 10px 10px"><a class="cta" href="${escapeHtml(url)}" style="display:block;border-radius:9px;background:#111;padding:12px 14px;color:#fff;font-size:11px;font-weight:900;text-align:center;text-decoration:none">Noter ce produit</a></td></tr></table></td></tr>`;
  }).join("");
  const productSection = products || `<tr><td style="padding:18px;border-radius:12px;background:#f7f8f7;text-align:center;color:#626963;font-size:13px">Retrouvez votre commande et partagez votre expérience depuis votre compte.</td></tr>`;

  return emailShell(`<tr><td class="pad" style="padding:38px 36px 32px">
    <div style="display:inline-block;border-radius:999px;background:#ecfdf0;padding:7px 11px;color:#17852d;font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase">Votre avis après livraison</div>
    <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2">Alors, qu'en pensez-vous, ${firstName} ?</h1>
    <p style="margin:0 0 9px;color:#626963;font-size:14px;line-height:1.65">Deux jours se sont écoulés depuis la livraison de la commande <strong style="color:#111">#${escapeHtml(args.orderNumber)}</strong>.</p>
    <p style="margin:0 0 25px;color:#626963;font-size:14px;line-height:1.65">Votre avis honnête sur chaque article aide les autres clients à choisir et nous permet d'améliorer la sélection L'ecomax.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${productSection}</table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-top:1px solid #edf0ed"><tr><td style="padding-top:18px;text-align:center">
      <p style="margin:0 0 10px;color:#7b817c;font-size:11px;line-height:1.5">Vous souhaitez aussi évaluer votre expérience globale ?</p>
      <a href="${trustpilotUrl}" style="color:#008f61;font-size:11px;font-weight:800;text-decoration:underline">Partager mon expérience sur Trustpilot</a>
    </td></tr></table>
    <p style="margin:18px 0 0;color:#9aa09b;font-size:10px;line-height:1.5;text-align:center">Ce rappel est envoyé automatiquement une seule fois, deux jours après la livraison.</p>
  </td></tr>`, `Comment trouvez-vous les produits de votre commande #${args.orderNumber} ?`);
}

export function initialReviewAutomationState(orderId: string, deliveredAt = new Date()) : ReviewAutomationState {
  return {
    orderId,
    deliveredAt: deliveredAt.toISOString(),
    followupDueAt: new Date(deliveredAt.getTime() + REVIEW_FOLLOWUP_DELAY_MS).toISOString(),
    productReviewSentAt: null,
    followupSentAt: null,
    productWhatsAppSentAt: null,
    followupWhatsAppSentAt: null,
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
