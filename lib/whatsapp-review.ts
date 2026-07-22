import "server-only";

type TemplateKind = "product" | "followup";

const templateNames: Record<TemplateKind, string | undefined> = {
  product: process.env.WHATSAPP_PRODUCT_REVIEW_TEMPLATE,
  followup: process.env.WHATSAPP_REVIEW_FOLLOWUP_TEMPLATE,
};

export type WhatsAppReviewResult =
  | { status: "sent"; messageId?: string }
  | { status: "missing_phone" | "not_configured" | "failed"; error?: string };

export function normalizeWhatsAppPhone(value?: string) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  return digits;
}

export async function sendReviewWhatsAppTemplate(args: {
  kind: TemplateKind;
  phone?: string;
  customerName: string;
  orderNumber: string;
}) : Promise<WhatsAppReviewResult> {
  const phone = normalizeWhatsAppPhone(args.phone);
  if (!phone) return { status: "missing_phone" };
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const template = templateNames[args.kind];
  if (!phoneId || !token || !template) return { status: "not_configured" };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "fr" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: args.customerName.split(" ")[0] || "Client" },
              { type: "text", text: args.orderNumber },
            ],
          }],
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { status: "failed", error: payload?.error?.message || `Meta HTTP ${response.status}` };
    return { status: "sent", messageId: payload?.messages?.[0]?.id };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "WhatsApp request failed" };
  }
}
