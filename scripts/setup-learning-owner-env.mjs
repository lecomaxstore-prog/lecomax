import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import nextEnv from '@next/env';
import argon2 from 'argon2';

nextEnv.loadEnvConfig(process.cwd());
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Fill OWNER_EMAIL in the root .env.local with your login email.');
}
if (!password || password.length < 14 || password.length > 1024) {
  throw new Error('Fill OWNER_PASSWORD in the root .env.local with 14–1024 characters.');
}
const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
const file = new URL('../.env.local', import.meta.url);
let env = await readFile(file, 'utf8');
const values = { OWNER_EMAIL: email, OWNER_PASSWORD_HASH: hash.replaceAll('$', '\\$'), SESSION_SECRET: process.env.SESSION_SECRET || randomBytes(32).toString('hex') };
for (const [key, value] of Object.entries(values)) {
  const line = key + '=' + JSON.stringify(value).replaceAll('\\\\$', '\\$');
  const pattern = new RegExp('^' + key + '=.*$', 'm');
  env = pattern.test(env) ? env.replace(pattern, () => line) : env + '\n' + line;
}
env = env.replace(/^OWNER_PASSWORD=.*\r?\n?/gm, '');
await writeFile(file, env.trimEnd() + '\n', { mode: 0o600 });
console.log('Login credentials saved. Plaintext password removed. Run npm run owner:check to verify the session database, then restart the backend.');
