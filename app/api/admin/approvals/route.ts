import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/approvals?status=pending|approved|rejected|all
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "admin:approvals:list", limit: 60 });
  if (blocked) return blocked;

  const status = req.nextUrl.searchParams.get("status") ?? "all";

  let query = supabase
    .from("pending_changes")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/admin/approvals — staff submits a change for review
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "admin:approvals:create", limit: 30 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  if (!body?.staff_email || !body?.action || !body?.entity_type || !body?.description) {
    return NextResponse.json(
      { error: "staff_email, action, entity_type, description sont requis" },
      { status: 400 }
    );
  }

  const validActions = ["create", "update", "delete"];
  if (!validActions.includes(body.action)) {
    return NextResponse.json({ error: "action invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pending_changes")
    .insert({
      staff_email:   body.staff_email.toLowerCase().trim(),
      staff_name:    body.staff_name ?? null,
      action:        body.action,
      entity_type:   body.entity_type,
      entity_id:     body.entity_id ?? null,
      description:   body.description,
      payload:       body.payload ?? null,
      api_endpoint:  body.api_endpoint ?? null,
      api_method:    body.api_method ?? null,
      preview_image: body.preview_image ?? null,
      status:        "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
