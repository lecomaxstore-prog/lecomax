const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const credentials=path.join(root,'credentials.json');
if(fs.existsSync(credentials)){console.log('Existing Android signing identity preserved.');process.exit(0);}
const folder=path.join(root,'.credentials');fs.mkdirSync(folder,{recursive:true});const store=path.join(folder,'learning.jks');if(fs.existsSync(store))throw new Error('Keystore exists without credentials; restore its password instead of replacing it.');
const password=crypto.randomBytes(32).toString('base64url');
const java=process.env.JAVA_HOME||'C:/Program Files/Android/Android Studio1/jbr';const keytool=path.join(java,'bin',process.platform==='win32'?'keytool.exe':'keytool');
const result=spawnSync(keytool,['-genkeypair','-storetype','JKS','-keystore',store,'-alias','learning','-keyalg','RSA','-keysize','4096','-validity','10000','-dname','CN=LECOMAX Learning, OU=Mobile, O=LECOMAX, C=MA','-storepass:env','LEARNING_STORE_PASSWORD','-keypass:env','LEARNING_STORE_PASSWORD'],{env:{...process.env,LEARNING_STORE_PASSWORD:password},windowsHide:true,encoding:'utf8'});
if(result.status!==0)throw new Error('Signing key generation failed. Check JAVA_HOME.');
fs.writeFileSync(credentials,JSON.stringify({android:{keystore:{keystorePath:'.credentials/learning.jks',keystorePassword:password,keyAlias:'learning',keyPassword:password}}},null,2),{mode:0o600});console.log('Dedicated Android signing identity created. Credentials are excluded from Git and app uploads.');
