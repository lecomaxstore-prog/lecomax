import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const {ownerDatabase}=await import('../lib/owner-auth-database.mjs');
try{const db=ownerDatabase();await db.transaction(async tx=>{
 await tx.query("DELETE FROM learning_private.sessions WHERE expires_at<now()-interval '7 days' OR revoked_at<now()-interval '7 days'");
 await tx.query('DELETE FROM learning_private.challenges WHERE expires_at<now()');
 await tx.query('DELETE FROM learning_private.throttle WHERE expires_at<now()');
});console.log('Expired authentication records cleaned.');process.exit(0);}catch{console.error('Authentication cleanup failed.');process.exit(1);}
