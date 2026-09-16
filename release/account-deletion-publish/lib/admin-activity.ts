import "server-only";
import type { NextRequest } from "next/server";
import { getAdminAccess } from "./admin-access";
import { createServerSupabaseClient } from "./supabase-server";

const FIELDS = ['name','slug','category','price','original_price','stock','color_stock','tags','colors','sizes','active','featured','preorder_enabled','preorder_estimated_at','preorder_message','title','subtitle','image','image_mobile','sort_order','link','starts_at','ends_at'];
export async function recordAdminActivity(req: NextRequest, area: 'product' | 'banner', entityId: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  try {
    const access = await getAdminAccess(req);
    if (!access) return false;
    const changes = Object.fromEntries(FIELDS.filter(key => JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after?.[key] ?? null)).map(key => [key, {before:before?.[key] ?? null,after:after?.[key] ?? null}]));
    if (!Object.keys(changes).length) return true;
    const { error } = await createServerSupabaseClient().from('admin_commerce_settings_audit').insert({admin_email:access.email,area,entity_id:entityId,action:!before?'create':!after?'delete':'update',changed_keys:Object.keys(changes),changes});
    if (error) throw error;
    return true;
  } catch { console.error('Admin activity could not be recorded'); return false; }
}
