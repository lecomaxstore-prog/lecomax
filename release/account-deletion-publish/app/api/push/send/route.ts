import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { broadcastPushNotification } from "@/lib/push-notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function isAdmin(req: NextRequest) {
  return isAdminRequest(req);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
  };
  try { body = await readJsonLimited(req); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  try {
    const result = await broadcastPushNotification({
      title: body.title.trim(),
      body: body.body,
      icon: body.icon,
      image: body.image,
      url: body.url,
      tag: body.tag,
      requireInteraction: body.requireInteraction,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Push failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await supabase
      .from("push_notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json(error ? [] : (data ?? []));
  } catch {
    return NextResponse.json([]);
  }
}
