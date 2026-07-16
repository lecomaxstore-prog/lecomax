import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildTrustpilotInviteHtml(customerName: string, orderNumber: string): string {
  const reviewUrl = "https://www.trustpilot.com/evaluate/lecomax.com";
  const firstName = customerName.split(" ")[0] || customerName;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0c1a12;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1a12;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0c1a12;border-radius:20px;overflow:hidden;">
  <!-- Header -->
  <tr>
    <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1a2e1f;">
      <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">L'eco<span style="color:#4ade80;">max</span></span>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:36px 40px 28px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">⭐</div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
        Votre avis compte, ${firstName} !
      </h1>
      <p style="margin:0 0 8px;font-size:15px;color:#9ca3af;line-height:1.6;">
        Votre commande <strong style="color:#ffffff;">${orderNumber}</strong> a bien été livrée.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
        Nous espérons qu'elle vous a plu ! Partagez votre expérience sur Trustpilot — cela prend 2 minutes et aide d'autres clients à nous faire confiance.
      </p>
      <a href="${reviewUrl}" style="display:inline-block;background:#4ade80;color:#0c1a12;font-size:16px;font-weight:800;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">
        Laisser un avis ⭐
      </a>
    </td>
  </tr>
  <!-- Stars visual -->
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <div style="display:inline-flex;gap:4px;font-size:28px;">⭐⭐⭐⭐⭐</div>
      <p style="margin:8px 0 0;font-size:12px;color:#4ade80;font-weight:600;">Trustpilot — Avis vérifiés</p>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:20px 40px 32px;border-top:1px solid #1a2e1f;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4b5563;line-height:1.6;">
        Vous recevez cet email car vous avez commandé sur lecomax.com<br>
        <a href="https://lecomax.com" style="color:#4ade80;text-decoration:none;">lecomax.com</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/orders/[id]  — update status, tracking_number, etc.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: { status?: string; tracking_number?: string | null; notes?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if ("status" in body) {
    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Statut de commande invalide." }, { status: 400 });
    }
    update.status = status;
  }
  if ("tracking_number" in body) {
    update.tracking_number = typeof body.tracking_number === "string"
      ? body.tracking_number.trim().slice(0, 120) || null
      : null;
  }
  if ("notes" in body) {
    update.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null;
  }
  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });
  }

  // Fetch previous status so we only award points on the transition to delivered
  const { data: prev } = await supabase
    .from("orders")
    .select("status, customer")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award 50 EcoClub points + send Trustpilot review invite when delivered for the first time
  if (update.status === "delivered" && prev?.status !== "delivered") {
    const customer = prev?.customer as { email?: string; name?: string; first_name?: string } | undefined;
    const email = customer?.email;
    const name = customer?.name || customer?.first_name || "Client";
    const orderNumber = (data as { order_number?: string }).order_number || id;

    if (email) {
      // EcoClub points
      supabase
        .from("user_points")
        .select("points")
        .eq("email", email)
        .single()
        .then(({ data: existing }) => {
          const newPoints = (existing?.points ?? 0) + 50;
          supabase
            .from("user_points")
            .upsert({ email, points: newPoints, updated_at: new Date().toISOString() }, { onConflict: "email" })
            .then(() => {});
        });

      // Trustpilot review invite email
      if (resend) {
        resend.emails.send({
          from: "L'ecomax <noreply@lecomax.com>",
          replyTo: "contact@lecomax.com",
          to: email,
          subject: `⭐ Votre commande est livrée — partagez votre avis !`,
          html: buildTrustpilotInviteHtml(name, orderNumber),
        }).catch(console.error);
      }
    }
  }

  return NextResponse.json(data);
}

// DELETE /api/orders/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
