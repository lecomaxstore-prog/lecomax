'use client';
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { glossary } from './resources';
import { normalize } from './progress';
import { text, type Text } from './types';
import styles from './Learning.module.css';

export const glossaryLinks: Record<string, [string, string]> = {
  Component: ['components/ProductCard.tsx', 'react-fundamentals'], Function: ['lib/db-server.ts', 'module-06-javascript-foundations'],
  Variable: ['components/CartContext.tsx', 'module-06-javascript-foundations'], Array: ['components/CartContext.tsx', 'module-07-js-data-problem-solving'],
  Object: ['lib/products.ts', 'module-07-js-data-problem-solving'], Props: ['components/ProductCard.tsx', 'react-fundamentals'],
  State: ['components/CartContext.tsx', 'react-state-forms-hooks'], Route: ['app/boutique/page.tsx', 'nextjs-app-router'],
  API: ['app/api/orders/route.ts', 'nextjs-server-data'], Database: ['lib/db-server.ts', 'supabase-platform'],
  Server: ['app/boutique/page.tsx', 'nextjs-server-data'], Client: ['app/boutique/BoutiqueClient.tsx', 'nextjs-app-router'],
  Import: ['components/Header.tsx', 'module-06-javascript-foundations'], Export: ['components/ProductCard.tsx', 'module-06-javascript-foundations'],
  Async: ['app/boutique/page.tsx', 'async-fetch-errors'], Await: ['app/boutique/page.tsx', 'async-fetch-errors'],
  Promise: ['components/CartContext.tsx', 'async-fetch-errors'], 'Environment variable': ['lib/supabase-server.ts', 'deployment-operations'],
  Repository: ['package.json', 'module-02-git-github'], GitHub: ['package.json', 'module-02-git-github'],
  Vercel: ['vercel.json', 'deployment-operations'], Localhost: ['package.json', 'module-00-learning-tools'],
  Production: ['scripts/next-build.mjs', 'deployment-operations'], Domain: ['app/layout.tsx', 'module-01-internet-web'],
  Deploy: ['vercel.json', 'deployment-operations'], Build: ['scripts/next-build.mjs', 'deployment-operations'],
  Hook: ['components/CartContext.tsx', 'react-state-forms-hooks'], JSON: ['components/CartContext.tsx', 'module-08-dom-forms-storage'],
};
const additional: [string, Text][] = [
  ['Hook', ['Une fonction React comme useState : elle ajoute une capacité au composant. useCart donne accès au panier partagé de ton site.', 'A React function such as useState adds a capability to a component. useCart accesses your site’s shared cart.', 'Hook هي Function كتزيد قدرة للـComponent، بحال useState باش يتذكر قيمة. useCart كيوصل للسلة المشتركة ديال موقعك.']],
  ['JSON', ['Un format de texte pour représenter des données. Ton panier utilise JSON.stringify pour conserver ses articles dans localStorage.', 'A text format for data. Your cart uses JSON.stringify to preserve items in localStorage.', 'JSON طريقة كتابة البيانات كنص. السلة كتستعمل JSON.stringify باش تحول العناصر لنص وتحفظهم فـlocalStorage، التخزين ديال Browser.']],
];
export default function Glossary({ lang }: { lang: CourseLanguage }) {
  const [query, setQuery] = useState('');
  const t = (value: Text) => text(value, lang);
  const entries = [...glossary, ...additional].filter(([name, definition]) => normalize([name, ...definition].join(' ')).includes(normalize(query)));
  return <details className={styles.glossary}>
    <summary>{t(['Un mot inconnu ? Mon glossaire', 'Unfamiliar word? My glossary', 'شي كلمة ما فهمتيهاش؟ القاموس'])}</summary>
    <label>{t(['Chercher un terme', 'Search a term', 'قلب على كلمة'])}<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="State, API, JSON…" /></label>
    {!entries.length && <p role="status">{t(['Aucun terme trouvé.', 'No matching term.', 'ما لقينا حتى كلمة.'])}</p>}
    {entries.map(([name, definition]) => <details key={name}><summary><bdi>{name}</bdi></summary><p>{t(definition)}</p><p>{t(['À retrouver dans ton projet :', 'Find it in your project:', 'كتلقاها فمشروعك:'])} <code dir="ltr">{glossaryLinks[name][0]}</code></p><a href={`#academy/${glossaryLinks[name][1]}`}>{t(['Comprendre cette notion', 'Learn this concept', 'فهم هاد الفكرة'])} →</a></details>)}
  </details>;
}
