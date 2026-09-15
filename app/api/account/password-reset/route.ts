import { NextRequest, NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/request-auth";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const user = await getCustomerUser(req);
    if (!user) return NextResponse.json({ error: "Votre session a expiré. Reconnectez-vous." }, { status: 401, headers });
    if (!user.email) return NextResponse.json({ error: "Aucune adresse e-mail associée à votre compte." }, { status: 400, headers });
    const limited = await sensitiveRateLimit(req, "account-password-reset", user.email);
    if (limited) return limited;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "Service de réinitialisation indisponible." }, { status: 503, headers });
    // Never accept an email or redirect from the caller: use the verified account.
    const redirect = new URL("/mot-de-passe", process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com");
    const endpoint = new URL("/auth/v1/recover", url);
    endpoint.searchParams.set("redirect_to", redirect.href);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (response.status === 429) return NextResponse.json(
      { error: "Trop de demandes. Patientez une minute avant de réessayer." },
      { status: 429, headers: { ...headers, "Retry-After": response.headers.get("retry-after") || "60" } },
    );
    if (!response.ok) return NextResponse.json({ error: "L’e-mail n’a pas pu être envoyé. Réessayez dans un instant." }, { status: 502, headers });
    return NextResponse.json({ message: "Consultez votre boîte de réception et vos courriers indésirables pour modifier votre mot de passe." }, { headers });
  } catch {
    return NextResponse.json({ error: "Service momentanément indisponible. Réessayez dans un instant." }, { status: 503, headers });
  }
}
