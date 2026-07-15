import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/request-auth";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const result = await broadcastAdminPushNotification({
      eventKey: `admin-test:${Date.now()}`,
      title: "Notifications admin activées ✓",
      body: "Votre appareil recevra désormais les nouvelles commandes et demandes clients.",
      url: "/admin/dashboard/",
      tag: "admin-push-test",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Échec du test" }, { status: 500 });
  }
}
