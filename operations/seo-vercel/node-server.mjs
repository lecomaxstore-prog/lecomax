// Optional Node 24 host adapter. Use behind an HTTPS reverse proxy; no scheduler.
// The same handler preserves database run fencing, authorization and deadlines.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createHandler } from './lib/handler.mjs';

export function createWorkerServer(options) {
  const handler = createHandler(options);
  const server = createServer((req, res) => {
    if (req.url !== '/api/sync') { res.writeHead(404); res.end(); return; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
    handler(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(503, { 'Cache-Control': 'no-store' });
      res.end();
    });
  });
  server.requestTimeout = 60_000;
  server.headersTimeout = 10_000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createWorkerServer().listen(Number(process.env.PORT || 8080), process.env.SEO_BIND_HOST || '127.0.0.1');
}
