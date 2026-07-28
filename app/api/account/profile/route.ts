import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";
import { awardEligibleProfileRewards } from "@/lib/profile-loyalty";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 60) : "";
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const phone = value.trim().replace(/[\s().-]/g, "");
  if (/^0[67]\d{8}$/.test(phone)) return phone;
  if (/^(?:\+|00)?212[67]\d{8}$/.test(phone)) return `0${phone.replace(/^(?:\+|00)?212/, "")}`;
  return "";
}

function hasPhoneValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Votre session a expiré. Reconnectez-vous." }, { status: 401 });

  let body: { prenom?: unknown; nom?: unknown; phone?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Informations invalides." }, { status: 400 }); }

  const prenom = cleanName(body.prenom);
  const nom = cleanName(body.nom);
  const phone = normalizePhone(body.phone);
  if (!prenom || !nom) {
    return NextResponse.json({ error: "Renseignez votre prénom et votre nom." }, { status: 400 });
  }
  if (hasPhoneValue(body.phone) && !phone) {
    return NextResponse.json({ error: "Saisissez un numéro marocain valide (06 ou 07)." }, { status: 400 });
  }

  const metadata = {
    ...(user.user_metadata ?? {}),
    prenom,
    nom,
    full_name: `${prenom} ${nom}`,
    phone,
  };
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, { user_metadata: metadata });
  if (error || !data.user) {
    return NextResponse.json({ error: "Impossible d’enregistrer votre profil pour le moment." }, { status: 500 });
  }

  try {
    const loyalty = await awardEligibleProfileRewards(data.user);
    return NextResponse.json(
      { profile: { prenom, nom, full_name: `${prenom} ${nom}`, phone }, loyalty },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (reason) {
    console.error("Profile loyalty reward failed", reason);
    return NextResponse.json(
      { profile: { prenom, nom, full_name: `${prenom} ${nom}`, phone }, loyalty: null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
