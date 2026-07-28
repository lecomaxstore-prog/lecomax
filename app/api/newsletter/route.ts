import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WELCOME_OFFER = "welcome10";
const WELCOME_DISCOUNT_PERCENT = 10;
const WELCOME_COUPON_DAYS = 30;

type WelcomeCouponRow = {
  code: string;
  value: number | string;
  expires_at: string | null;
  used_count: number | null;
  max_uses: number | null;
};

function welcomeCouponCode(subscriberId: string) {
  const token = subscriberId.replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase();
  return `BIENVENUE-${token}`;
}

function welcomeCouponResponse(coupon: WelcomeCouponRow) {
  const maxUses = coupon.max_uses ?? 1;
  return {
    code: coupon.code,
    percent: Number(coupon.value),
    expires_at: coupon.expires_at,
    available: (coupon.used_count ?? 0) < maxUses,
    eligible_products: "non_promotional_only" as const,
  };
}

async function ensureWelcomeCoupon(subscriberId: string) {
  const code = welcomeCouponCode(subscriberId);
  const couponFields = "code,value,expires_at,used_count,max_uses";
  const { data: existing, error: lookupError } = await supabase
    .from("coupons")
    .select(couponFields)
    .eq("code", code)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return welcomeCouponResponse(existing as WelcomeCouponRow);

  const expiresAt = new Date(
    Date.now() + WELCOME_COUPON_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: created, error: createError } = await supabase
    .from("coupons")
    .insert({
      code,
      type: "percent",
      value: WELCOME_DISCOUNT_PERCENT,
      min_order: null,
      max_uses: 1,
      used_count: 0,
      expires_at: expiresAt,
      active: true,
    })
    .select(couponFields)
    .single();

  if (!createError && created) {
    return welcomeCouponResponse(created as WelcomeCouponRow);
  }

  // A simultaneous request may have created the deterministic code first.
  const { data: racedCoupon, error: retryError } = await supabase
    .from("coupons")
    .select(couponFields)
    .eq("code", code)
    .maybeSingle();
  if (retryError || !racedCoupon) throw createError ?? retryError ?? new Error("Coupon creation failed");
  return welcomeCouponResponse(racedCoupon as WelcomeCouponRow);
}

export async function GET() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Newsletter list failed", error);
    return NextResponse.json({ error: "Impossible de charger les abonnés" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string"
    ? body.email.normalize("NFKC").trim().toLowerCase()
    : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  const wantsWelcomeOffer = body?.offer === WELCOME_OFFER;
  const settingKeys = wantsWelcomeOffer
    ? ["enable_newsletter", "enable_coupons"]
    : ["enable_newsletter"];
  const { data: featureSettings, error: settingsError } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", settingKeys);
  if (settingsError) {
    console.error("Newsletter settings lookup failed", settingsError);
    return NextResponse.json({ error: "Inscription impossible pour le moment" }, { status: 503 });
  }
  const settingValue = (key: string) =>
    featureSettings?.find((setting) => setting.key === key)?.value;
  if (settingValue("enable_newsletter") === "false") {
    return NextResponse.json(
      { error: "La newsletter est temporairement désactivée" },
      { status: 403 },
    );
  }
  if (wantsWelcomeOffer && settingValue("enable_coupons") === "false") {
    return NextResponse.json(
      { error: "L’offre de bienvenue est temporairement indisponible" },
      { status: 403 },
    );
  }

  const name = typeof body?.name === "string" && body.name.trim()
    ? body.name.trim().slice(0, 120)
    : null;
  const source = typeof body?.source === "string" && body.source.trim()
    ? body.source.trim().slice(0, 60)
    : "website";

  const { data: existingSubscriber, error: lookupError } = await supabase
    .from("newsletter_subscribers")
    .select("id,active")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    console.error("Newsletter lookup failed", lookupError);
    return NextResponse.json({ error: "Inscription impossible pour le moment" }, { status: 500 });
  }

  let subscriber = existingSubscriber;
  let alreadySubscribed = Boolean(existingSubscriber?.active);
  if (!subscriber?.active) {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, name, active: true, source }, { onConflict: "email" })
      .select("id,email,name,active,source,created_at")
      .single();
    if (error) {
      console.error("Newsletter signup failed", error);
      return NextResponse.json({ error: "Inscription impossible pour le moment" }, { status: 500 });
    }
    subscriber = data;
    alreadySubscribed = false;
  }

  if (wantsWelcomeOffer) {
    try {
      const coupon = await ensureWelcomeCoupon(String(subscriber.id));
      return NextResponse.json(
        {
          alreadySubscribed,
          message: coupon.available
            ? "Votre remise de bienvenue est prête."
            : "Votre offre de bienvenue a déjà été utilisée.",
          coupon,
        },
        { status: alreadySubscribed ? 200 : 201 },
      );
    } catch (error) {
      console.error("Welcome coupon creation failed", error);
      return NextResponse.json(
        {
          error: "Votre inscription est enregistrée, mais le code n’a pas pu être créé. Réessayez.",
          code: "WELCOME_COUPON_FAILED",
        },
        { status: 503 },
      );
    }
  }

  if (alreadySubscribed) {
    return NextResponse.json({
      alreadySubscribed: true,
      message: "Vous êtes déjà inscrit(e) à notre newsletter.",
    });
  }
  return NextResponse.json({ ...subscriber, alreadySubscribed: false }, { status: 201 });
}
