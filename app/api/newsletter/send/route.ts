import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { protectAdminMutation } from "@/lib/api-security";
import { buildNewsletterEmail, type NewsletterCampaign, type NewsletterProduct } from "@/lib/newsletter-email";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "newsletter:send", limit: 5 });
  if (blocked) return blocked;
  const input = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!input) return NextResponse.json({ error: "Campagne invalide." }, { status: 400 });

  const campaign: NewsletterCampaign = {
    subject: text(input.subject, 120),
    preheader: text(input.preheader, 160),
    eyebrow: text(input.eyebrow, 60),
    heading: text(input.heading, 100),
    body: text(input.body, 1200),
    ctaLabel: text(input.ctaLabel, 40),
    ctaUrl: text(input.ctaUrl, 300),
    sectionTitle: text(input.sectionTitle, 80),
    heroImage: text(input.heroImage, 500),
    ctaBackground: color(input.ctaBackground, "#111111"),
    ctaTextColor: color(input.ctaTextColor, "#ffffff"),
    ctaRadius: String(Math.min(30, Math.max(0, Number(input.ctaRadius) || 6))),
  };
  if (!campaign.subject || !campaign.heading || !campaign.body || !campaign.ctaLabel) {
    return NextResponse.json({ error: "Objet, titre, message et bouton sont requis." }, { status: 400 });
  }
  const productIds = Array.isArray(input.productIds)
    ? [...new Set(input.productIds.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 12)
    : [];

  const [{ data: subscribers, error: subscriberError }, { data: products, error: productError }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("email,name").eq("active", true),
    productIds.length
      ? supabase.from("products").select("id,slug,name,price,original_price,images").in("id", productIds).eq("active", true)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (subscriberError || !subscribers?.length) return NextResponse.json({ error: "Aucun abonné actif trouvé." }, { status: 400 });
  if (productError) return NextResponse.json({ error: "Impossible de charger les produits sélectionnés." }, { status: 500 });

  const html = buildNewsletterEmail(campaign, (products ?? []) as NewsletterProduct[]);
  let sent = 0;
  const errors: string[] = [];
  for (const subscriber of subscribers) {
    const result = await resend.emails.send({
      from: "L'ecomax <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: subscriber.email,
      subject: campaign.subject,
      html,
      headers: { "List-Unsubscribe": "<mailto:contact@lecomax.com?subject=Desinscription%20newsletter>" },
    });
    if (result.error) errors.push(`${subscriber.email}: ${result.error.message}`);
    else sent += 1;
  }
  if (!sent) return NextResponse.json({ error: errors[0] || "Échec de l'envoi." }, { status: 500 });
  return NextResponse.json({ sent, failed: errors.length });
}
