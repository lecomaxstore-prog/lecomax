import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("account_deletion_requests")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        status: "pending",
        requested_at: new Date().toISOString(),
        resolved_at: null,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Account deletion request failed", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer votre demande pour le moment." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      requested: true,
      message: "Votre demande de suppression a bien été enregistrée.",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
