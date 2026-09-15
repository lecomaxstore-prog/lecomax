import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { protectAdminMutation } from '@/lib/api-security';
import { getAdminAccess } from '@/lib/admin-access';
import { parseBulkInput, bulkProductPatch, type BulkProduct } from '@/lib/product-bulk';
import { recordAdminActivity } from '@/lib/admin-activity';
import { publishProductDiscovery } from '@/lib/product-discovery';

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: 'products:bulk', limit: 10 });
  if (blocked) return blocked;
  if (!(await getAdminAccess(req))?.owner) return NextResponse.json({ error: 'Action réservée au propriétaire.' }, { status: 403 });
  let input;
  try { input = parseBulkInput(await readJsonLimited(req)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Requête invalide.' }, { status: 400 }); }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of input.ids) {
    const { data: current, error: readError } = await db.from('products').select('*').eq('id', id).maybeSingle();
    if (readError || !current) { results.push({ id, ok: false, error: readError ? 'Lecture impossible.' : 'Produit introuvable.' }); continue; }
    let patch;
    try { patch = bulkProductPatch(current as BulkProduct, input); }
    catch (error) { results.push({ id, ok: false, error: error instanceof Error ? error.message : 'Modification invalide.' }); continue; }
    const { data, error } = await db.rpc('apply_product_bulk_change', { p_id: id, p_expected: current, p_patch: patch, p_delete: input.action === 'delete' });
    if (error) {
      console.error('Bulk product mutation failed', error.code, error.message);
      results.push({ id, ok: false, error: publicDatabaseError(error).includes('PRODUCT_CHANGED') ? 'Produit modifié ailleurs. Actualisez avant de réessayer.' : 'Modification impossible. Vérifiez la migration et réessayez après actualisation.' });
      continue;
    }
    results.push({ id, ok: true });
    // A post-commit side effect must never turn an applied stock adjustment into a retryable failure.
    try {
      await recordAdminActivity(req, 'product', id, data.previous, data.current);
      publishProductDiscovery({ previous: data.previous, current: data.current });
    } catch (error) { console.error('Bulk product post-commit refresh failed', error); }
  }
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
}
