export function validApprovalTarget(entity: unknown, action: unknown, endpoint: unknown, method: unknown) {
  const resources: Record<string,string> = {product:'products',banner:'banners',promotion:'promotions',coupon:'coupons',page:'pages',category:'categories',announcement:'announcements'};
  if (typeof entity !== 'string' || !resources[entity] || typeof endpoint !== 'string') return false;
  const base = `/api/${resources[entity]}`;
  if (action === 'create') return method === 'POST' && (endpoint === base || endpoint === `${base}/`);
  return (action === 'update' ? method === 'PUT' || method === 'PATCH' : action === 'delete' && method === 'DELETE') && new RegExp(`^${base}/[0-9a-f-]{36}/?$`, 'i').test(endpoint);
}
