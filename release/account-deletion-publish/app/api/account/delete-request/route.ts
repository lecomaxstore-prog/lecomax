import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";

export async function POST(req: NextRequest) {
  try {
  const user = await getCustomerUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }

  let body: { confirmation?: unknown } | null;
  try { body = await readJsonLimited(req); }
  catch { return NextResponse.json({ error: "Confirmation invalide." }, { status: 400 }); }
  if (body?.confirmation !== "remove my account") {
    return NextResponse.json({ error: "Saisissez exactement remove my account pour confirmer." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await supabase
    .from("account_deletion_requests")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        status: "pending",
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Account deletion request failed", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer votre demande pour le moment." },
      { status: 500 },
    );
  }

  const { data: request, error: statusError } = await supabase.from("account_deletion_requests")
    .select("status").eq("user_id", user.id).single();
  if (statusError || !request) return NextResponse.json({ error: "Impossible de vérifier votre demande. Réessayez." }, { status: 503 });
  const messages: Record<string, string> = {
    pending: "Votre demande est enregistrée et attend son examen. Votre compte reste actif jusqu’à son traitement.",
    processing: "Votre demande de suppression est déjà en cours de traitement.",
    completed: "Votre demande a déjà été traitée. Contactez l’assistance pour toute question.",
    rejected: "Votre précédente demande n’a pas été acceptée. Contactez l’assistance pour connaître les prochaines étapes.",
  };

  return NextResponse.json(
    {
      requested: true,
      status: request.status,
      message: messages[request.status] || "Contactez l’assistance pour vérifier votre demande.",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  } catch {
    return NextResponse.json({ error: "Service momentanément indisponible. Réessayez." }, { status: 503 });
  }
}
