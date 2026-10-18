import nextEnv from '@next/env';
import {readFile} from 'node:fs/promises';
nextEnv.loadEnvConfig(process.cwd());
const {ownerDatabase}=await import('../lib/owner-auth-database.mjs');
try{const sql=await readFile(new URL('../supabase/migrations/202610080001_learning_owner_sessions.sql',import.meta.url),'utf8');await ownerDatabase().transaction(tx=>tx.query(sql));console.log('Private learning session schema ready. Existing learning data was not changed.');process.exit(0);}catch{console.error('Migration failed. Check OWNER_DATABASE_URL, TLS trust, and schema-creation permissions.');process.exit(1);}
