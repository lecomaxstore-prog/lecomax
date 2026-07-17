import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/admin/approvals/[id]
// body: { decision: 'approve' | 'reject', reviewer_email: string, rejection_reason?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await protectAdminMutation(req, { key: "admin:approvals:review", limit: 30 });
  if (blocked) return blocked;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.decision || !body?.reviewer_email) {
    return NextResponse.json(
      { error: "decision et reviewer_email sont requis" },
      { status: 400 }
    );
  }
  if (!["approve", "reject"].includes(body.decision)) {
    return NextResponse.json({ error: "decision invalide" }, { status: 400 });
  }
  if (body.decision === "reject" && !body.rejection_reason?.trim()) {
    return NextResponse.json(
      { error: "Une raison est requise pour le rejet" },
      { status: 400 }
    );
  }

  // Fetch the change
  const { data: change, error: fetchErr } = await supabase
    .from("pending_changes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !change) {
    return NextResponse.json({ error: "Changement introuvable" }, { status: 404 });
  }
  if (change.status !== "pending") {
    return NextResponse.json(
      { error: "Ce changement a déjà été traité" },
      { status: 409 }
    );
  }

  // ── Auto-apply on approve ──────────────────────────────────────────────────
  if (body.decision === "approve" && change.api_endpoint && change.api_method && change.payload) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      // Inject created_by for product creations so staff can see their approved products
      const applyPayload =
        change.entity_type === "product" && change.action === "create"
          ? { ...change.payload, created_by: change.staff_email }
          : change.payload;
      const applyRes = await fetch(`${baseUrl}${change.api_endpoint}`, {
        method: change.api_method,
        headers: {
          "Content-Type": "application/json",
          // The owner has already authenticated this approval request. Forward
          // that signed session to the protected mutation endpoint so the
          // internal apply step follows the same authorization path.
          Cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify(applyPayload),
      });
      if (!applyRes.ok) {
        const errText = await applyRes.text().catch(() => "");
        return NextResponse.json(
          { error: `Échec de l'application : ${errText || applyRes.status}` },
          { status: 500 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: `Erreur réseau lors de l'application : ${String(e)}` },
        { status: 500 }
      );
    }
  }

  // ── Update the record ──────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from("pending_changes")
    .update({
      status:           body.decision === "approve" ? "approved" : "rejected",
      rejection_reason: body.decision === "reject" ? body.rejection_reason : null,
      reviewed_by:      body.reviewer_email,
      reviewed_at:      new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json(updated);
}

// DELETE /api/admin/approvals/[id] — hard delete a change request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await protectAdminMutation(req, { key: "admin:approvals:delete", limit: 20 });
  if (blocked) return blocked;

  const { id } = await params;
  const { error } = await supabase.from("pending_changes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
