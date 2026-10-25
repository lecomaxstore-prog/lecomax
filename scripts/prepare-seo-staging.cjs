// Produces a schema-only, synthetic-data package. Never connects to a remote database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root='C:\\Users\\Ziko\\Backups\\LECOMAX\\restore-test-20261018';
const dest=path.resolve('artifacts/seo-staging');fs.mkdirSync(dest,{recursive:true});
const source=fs.readFileSync(path.join(root,'archive-schema.sql'),'utf8');
const tables=['products','categories','admin_roles','admin_role_permissions','admin_staff'];
const selected=[];
for(const block of source.split(/\n--\n-- Name: /).slice(1)){
 const header=block.split('\n')[0],m=header.match(/^(.*); Type: (.*); Schema: (.*); Owner: (.*)$/);if(!m||m[3]!=='public')continue;
 const [name,type]=[m[1],m[2]];
 const allowed=['TABLE','CONSTRAINT','FK CONSTRAINT','INDEX','POLICY','ROW SECURITY','ACL'];
 if(!allowed.includes(type))continue;
 const tableMatch=t=>name===t||name.startsWith(t+' ')||name==='TABLE '+t||(type==='INDEX'&&new RegExp(' ON public\\.'+t+'[ (]').test(block));
 if(!tables.some(tableMatch))continue;
 // Preserve constraints, RLS and grants. Hosted postgres owns these application tables.
 selected.push('-- Name: '+block.trim());
}
if(selected.filter(b=>b.includes('; Type: TABLE;')).length!==5)throw Error('Staging table inventory mismatch');
const guard=`-- Synthetic staging only. Use a NEW isolated Supabase project, never production.\nBEGIN;\nDO $$ BEGIN\n IF current_setting('lecomax.staging_only',true) IS DISTINCT FROM 'synthetic-seo-test' THEN\n  RAISE EXCEPTION 'Staging acknowledgement required; verify the project identity first';\n END IF;\n IF to_regclass('public.products') IS NOT NULL OR to_regclass('public.categories') IS NOT NULL THEN\n  RAISE EXCEPTION 'Target is not empty; refusing staging bootstrap';\n END IF;\n IF to_regprocedure('extensions.gen_random_bytes(integer)') IS NULL THEN\n  RAISE EXCEPTION 'pgcrypto in extensions is required';\n END IF;\nEND $$;\n`;
const fixture=`\nINSERT INTO public.categories(id,name,slug,description,active) VALUES('10000000-0000-4000-8000-000000000001','Staging accessories','accessoires','Synthetic category only',true);\nINSERT INTO public.products(id,slug,name,category,price,description,active,stock) VALUES('20000000-0000-4000-8000-000000000001','staging-seo-product','Staging SEO product','accessoires',99,'Synthetic product for SEO verification.',true,10);\nINSERT INTO public.admin_roles(id,name,slug) VALUES\n ('30000000-0000-4000-8000-000000000001','Staging viewer','staging-viewer'),\n ('30000000-0000-4000-8000-000000000002','Staging editor','staging-editor');\nINSERT INTO public.admin_role_permissions(role_id,permission_slug) VALUES\n ('30000000-0000-4000-8000-000000000001','products.view'),\n ('30000000-0000-4000-8000-000000000002','products.view'),\n ('30000000-0000-4000-8000-000000000002','products.create'),\n ('30000000-0000-4000-8000-000000000002','products.edit');\nINSERT INTO public.admin_staff(email,name,role_id,status,invite_token) VALUES\n ('viewer@staging.invalid','Staging viewer','30000000-0000-4000-8000-000000000001','active',null),\n ('editor@staging.invalid','Staging editor','30000000-0000-4000-8000-000000000002','active',null);\nCOMMIT;\n`;
const sql=guard+selected.join('\n\n')+'\n'+fixture;
fs.writeFileSync(path.join(dest,'synthetic-baseline.sql'),sql);
const report={createdAt:new Date().toISOString(),tables,selectedSchemaBlocks:selected.length,containsProductionRows:false,sha256:crypto.createHash('sha256').update(sql).digest('hex'),executedAgainstHostedStaging:false};
fs.writeFileSync(path.join(dest,'package.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
