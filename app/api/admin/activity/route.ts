import { NextRequest, NextResponse } from 'next/server';
import { protectAdminRead } from '@/lib/api-security';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req,{key:'admin:activity',limit:60});
  if (blocked) return blocked;
  const page = Number(req.nextUrl.searchParams.get('page') ?? 0);
  if (!Number.isInteger(page) || page < 0 || page > 10000) return NextResponse.json({error:'Page invalide'},{status:400});
  const {data,error} = await createServerSupabaseClient().from('admin_commerce_settings_audit').select('id,admin_email,area,changed_keys,changes,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*30,page*30+30);
  if (error) return NextResponse.json({error:'Historique indisponible'},{status:503});
  return NextResponse.json({items:(data ?? []).slice(0,30),hasMore:(data?.length ?? 0)>30},{headers:{'Cache-Control':'private, no-store'}});
}
