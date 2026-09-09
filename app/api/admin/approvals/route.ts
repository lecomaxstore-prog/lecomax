import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { getAdminAccess } from "@/lib/admin-access";
import { validApprovalTarget } from "@/lib/approval-target";
import { adminApiPermission, hasAdminPermission } from "@/lib/admin-policy";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/approvals?status=pending|approved|rejected|all
export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "admin:approvals:list", limit: 60 });
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!access) return NextResponse.json({error:"Unauthorized"},{status:401});

  const status = req.nextUrl.searchParams.get("status") ?? "all";

  let query = supabase
    .from("pending_changes")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (!access.owner) query = query.eq("staff_email", access.email);
  query = query.limit(100);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/admin/approvals — staff submits a change for review
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "admin:approvals:create", limit: 30 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const access = await getAdminAccess(req);
  if (!access) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (body?.api_endpoint && (!validApprovalTarget(body.entity_type, body.action, body.api_endpoint, body.api_method) || !hasAdminPermission(access, adminApiPermission(body.api_endpoint, body.api_method)))) return NextResponse.json({error:"Action non autorisée"},{status:403});
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
      staff_email:   access.email,
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
