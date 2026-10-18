export type Actor = { id: string };
export type Order = { id: string; ownerId: string; totalCents: number; staffNote: string };
export type Dependencies = {
  session: (request: Request) => Promise<Actor | null>;
  findOwned: (id: string, ownerId: string) => Promise<Order | null>;
};
export function createOrderGET(deps: Dependencies) {
  return async function GET(request: Request): Promise<Response> {
    const headers = { 'Cache-Control': 'private, no-store' };
    try {
      const actor = await deps.session(request);
      if (!actor) return Response.json({ message: 'Authentication required' }, { status: 401, headers });
      const id = new URL(request.url).searchParams.get('id');
      if (!id || !/^order-[a-z0-9]{1,40}$/.test(id))
        return Response.json({ message: 'Invalid order id' }, { status: 400, headers });
      const order = await deps.findOwned(id, actor.id);
      if (!order) return Response.json({ message: 'Not found' }, { status: 404, headers });
      return Response.json({ id: order.id, totalCents: order.totalCents }, { headers });
    } catch {
      return Response.json({ message: 'Request could not be completed' }, { status: 503, headers });
    }
  };
}
// In an App Router route module, export GET = createOrderGET(realDependencies).
// realDependencies must validate sessions and perform a parameterized owner-constrained query.
// This factory is executable in tests; it is not connected to the real shop.
