import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { buildOrderLifecycleEmail, ORDER_LIFECYCLE_SUBJECTS } from "@/lib/order-lifecycle-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type NotifyType = "confirmed" | "shipped" | "delivered" | "cancelled";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const body = await readJsonLimited(req) as {
    type: NotifyType;
    channel: "email" | "both";
  };

  // Fetch order from DB
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const name = order.customer?.name ?? "Client";
  const email = order.customer?.email ?? "";
  const orderNumber = order.order_number ?? id;
  const items = (order.items ?? [])
    .map((i: { name: string; qty: number; size?: string; color?: string }) =>
      `• ${i.name} x${i.qty}${i.size ? ` (${i.size})` : ""}${i.color ? ` — ${i.color}` : ""}`)
    .join("\n");
  const total = order.total ?? 0;
  const tracking = order.tracking_number ?? "";

  const results: { email?: string; error?: string } = {};

  if (body.channel === "email" || body.channel === "both") {
    if (!email) {
      results.email = "no_email";
    } else if (!process.env.RESEND_API_KEY) {
      results.email = "not_configured";
    } else {
      const html = buildOrderLifecycleEmail({
        type: body.type,
        customerName: name,
        orderNumber,
        items: order.items ?? [],
        total: Number(total),
        trackingNumber: tracking,
      });
      const { error: emailError } = await resend.emails.send({
        from: "L'ecomax <noreply@lecomax.com>",
        replyTo: "contact@lecomax.com",
        to: [email],
        subject: ORDER_LIFECYCLE_SUBJECTS[body.type](orderNumber),
        html,
      });
      results.email = emailError ? `error: ${emailError.message}` : "sent";
    }
  }

  // Auto-update order status if appropriate
  const STATUS_MAP: Partial<Record<NotifyType, string>> = {
    confirmed: "confirmed",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  const newStatus = STATUS_MAP[body.type];
  if (newStatus && order.status !== newStatus) {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
  }

  return NextResponse.json({ ok: true, results, newStatus });
}
