import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const {ownerConfig}=await import('../lib/owner-auth-core.ts');
const {ownerDatabase}=await import('../lib/owner-auth-database.mjs');
try{ownerConfig();await ownerDatabase().query('SELECT id FROM learning_private.sessions LIMIT 0');console.log('Owner authentication configuration and session database verified.');process.exit(0);}catch{console.error('Owner authentication unavailable. Check private backend configuration and apply the session migration.');process.exit(1);}
