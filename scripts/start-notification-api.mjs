import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import next from 'next';
const require = createRequire(import.meta.url);
const config = require('../next.config.js');
const app = next({ dev: true, dir: process.cwd(), conf: { ...config, distDir: 'out/notifications-api' } });
await app.prepare();
createServer(app.getRequestHandler()).listen(3002, '127.0.0.1', () => console.log('Notification API test server: http://127.0.0.1:3002'));
