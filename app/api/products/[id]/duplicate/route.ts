import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { protectAdminMutation } from '@/lib/api-security';
import { getAdminAccess } from '@/lib/admin-access';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { productDuplicate } from '@/lib/product-duplicate';
import { cleanProductPayload } from '@/lib/product-api-validation';
import { recordAdminActivity } from '@/lib/admin-activity';

export async function POST(req: NextRequest, {params}: {params:Promise<{id:string}>}) {
  const blocked = await protectAdminMutation(req,{key:'products:duplicate',limit:15});
  if (blocked) return blocked;
  const access = await getAdminAccess(req);
  if (!access || (!access.owner && !access.permissions.includes('products.view'))) return NextResponse.json({error:'Accès refusé'},{status:403});
  const {id} = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({error:'Identifiant invalide'},{status:400});
  const db = createServerSupabaseClient();
  const {data:source,error} = await db.from('products').select('*').eq('id',id).maybeSingle();
  if (error) return NextResponse.json({error:'Catalogue indisponible'},{status:503});
  if (!source) return NextResponse.json({error:'Produit introuvable'},{status:404});
  const cleaned = cleanProductPayload(productDuplicate(source,randomUUID().replaceAll('-','').slice(0,12)),'create');
  if (!cleaned.payload) return NextResponse.json({error:cleaned.error},{status:400});
  if (!access.owner) {
    const {error:pendingError} = await db.from('pending_changes').insert({staff_email:access.email,action:'create',entity_type:'product',description:`Dupliquer ${source.name}`,payload:cleaned.payload,api_endpoint:'/api/products',api_method:'POST',status:'pending'});
    return pendingError ? NextResponse.json({error:'Impossible de soumettre la copie'},{status:503}) : NextResponse.json({pending:true},{status:202});
  }
  const {data,error:insertError} = await db.from('products').insert(cleaned.payload).select().single();
  if (insertError) return NextResponse.json({error:'Impossible de dupliquer le produit'},{status:503});
  const auditRecorded = await recordAdminActivity(req,'product',data.id,null,data);
  return NextResponse.json({id:data.id,active:false,auditRecorded},{status:201,headers:{'Cache-Control':'no-store'}});
}
