import { STORE_SETTING_DEFAULTS } from "../mobile/src/lib/store-settings.ts";
import fs from 'fs';
import https from 'https';

const env = fs.readFileSync("c:/Users/Ziko/Desktop/my projects/L'ecomax/.env.local", 'utf8');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)?.[1]?.replace(/\s/g,'');
const url = 'https://yddqwgdgeljkzfsmtein.supabase.co';

// Run all migrations via Supabase SQL over REST
const statements = [
  // 1. Create knowledge base table
  `CREATE TABLE IF NOT EXISTS chat_knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question text NOT NULL,
    answer text NOT NULL,
    category text DEFAULT 'general',
    language text DEFAULT 'all',
    active boolean DEFAULT true,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`,
  // 2. Add columns to data_collection_consents if they don't exist
  `ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS ip_address text`,
  `ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS country text`,
  `ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS city text`,
  `ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS latitude numeric`,
  `ALTER TABLE data_collection_consents ADD COLUMN IF NOT EXISTS longitude numeric`,
  // 3. Seed starter Q&As
  `INSERT INTO chat_knowledge_base (question, answer, category, language, sort_order) VALUES
    ('Quel est le délai de livraison ?', 'La livraison prend ${STORE_SETTING_DEFAULTS.shipping_estimated_days} partout au Maroc. Le tarif est fixe : 35 MAD quelle que soit votre commande.', 'livraison', 'fr', 1),
    ('كم يستغرق التوصيل؟', 'التوصيل يستغرق من 2 إلى 5 أيام عمل في جميع أنحاء المغرب. التكلفة ثابتة: 35 درهم فقط.', 'livraison', 'ar', 2),
    ('Comment suivre ma commande ?', 'Rendez-vous sur lecomax.com/suivre-commande, entrez votre numéro de commande et votre numéro de téléphone. Vous verrez le statut en temps réel.', 'commande', 'fr', 3),
    ('كيف أتتبع طلبيتي؟', 'يمكنك تتبع طلبيتك على lecomax.com/suivre-commande عن طريق إدخال رقم الطلب ورقم هاتفك.', 'commande', 'ar', 4),
    ('Comment retourner un produit ?', 'Vous avez 30 jours pour retourner tout article. Le produit doit être dans son état d''origine. Visitez lecomax.com/retours pour démarrer votre retour gratuitement.', 'retours', 'fr', 5),
    ('Quels sont les modes de paiement ?', 'Nous acceptons uniquement le paiement à la livraison (cash on delivery). Vous payez uniquement quand vous recevez votre colis — aucun paiement en avance, aucun risque.', 'paiement', 'fr', 6),
    ('طريقة الدفع عندكم؟', 'نقبل فقط الدفع عند الاستلام. لا تدفع شيئاً حتى تستلم طلبيتك وتتأكد منها.', 'paiement', 'ar', 7),
    ('What payment methods do you accept?', 'We only accept cash on delivery (COD). You pay only when you receive your package — no prepayment required, zero risk.', 'paiement', 'en', 8),
    ('Est-ce que vous livrez dans toutes les villes du Maroc ?', 'Oui ! Nous livrons dans toutes les villes et régions du Maroc, du nord au sud. Le tarif est toujours 35 MAD, peu importe la ville.', 'livraison', 'fr', 9),
    ('Quelle est votre politique de retour ?', 'Retours gratuits pendant 30 jours après réception. Le produit doit être non utilisé et dans son emballage d''origine. Contactez-nous sur lecomax.com/retours.', 'retours', 'fr', 10),
    ('هل يمكن إلغاء الطلب؟', 'نعم، يمكنك إلغاء طلبيتك قبل الشحن. تواصل معنا فوراً عبر contact@lecomax.com أو WhatsApp مع رقم طلبيتك.', 'commande', 'ar', 11),
    ('Comment annuler ma commande ?', 'Vous pouvez annuler votre commande avant expédition. Contactez-nous immédiatement sur contact@lecomax.com ou via WhatsApp avec votre numéro de commande.', 'commande', 'fr', 12),
    ('Avez-vous un programme de fidélité ?', 'Oui ! L''EcoClub vous permet de gagner des points à chaque achat et de les échanger contre des réductions. Rejoignez-nous gratuitement sur lecomax.com/ecoclub.', 'fidélité', 'fr', 13),
    ('هل عندكم برنامج نقاط؟', 'نعم! برنامج EcoClub يتيح لك كسب نقاط مع كل عملية شراء وتحويلها إلى خصومات. انضم مجاناً على lecomax.com/ecoclub.', 'fidélité', 'ar', 14),
    ('Où êtes-vous situés ?', 'L''ecomax est basé à Sidi Bennour, Maroc. Nous sommes une boutique en ligne — vous commandez sur lecomax.com et nous livrons chez vous.', 'contact', 'fr', 15),
    ('Comment vous contacter ?', 'Vous pouvez nous joindre par email sur contact@lecomax.com, via WhatsApp depuis notre site, ou via le formulaire sur lecomax.com/nous-contacter. Nous répondons en quelques heures.', 'contact', 'fr', 16)
  ON CONFLICT DO NOTHING`,
];

async function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'yddqwgdgeljkzfsmtein.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Also try direct pg-level SQL via Supabase's /rest/v1/ POST to pg
async function runDirectSql(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'yddqwgdgeljkzfsmtein.supabase.co',
      path: '/pg/query',
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Running migrations...');
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i].trim();
    const preview = sql.slice(0, 60).replace(/\n/g, ' ');
    const r = await runQuery(sql);
    if (r.status === 200 || r.status === 204) {
      console.log(`✓ [${i+1}/${statements.length}] ${preview}...`);
    } else {
      // Try alternative endpoint
      const r2 = await runDirectSql(sql);
      if (r2.status === 200 || r2.status === 204) {
        console.log(`✓ [${i+1}/${statements.length}] ${preview}...`);
      } else {
        console.log(`✗ [${i+1}/${statements.length}] Status ${r.status}: ${r.body.slice(0,200)}`);
      }
    }
  }
  console.log('Done!');
})();
