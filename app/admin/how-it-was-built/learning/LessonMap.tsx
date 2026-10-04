import type { CourseLanguage } from '../course/types';
import { text, type Text } from './types';
import styles from './Learning.module.css';

// Reading order, not a claim that each arrow is a runtime function call.
const maps: Record<string, string[]> = {
  web: ['Navigateur / Browser', 'app/page.tsx', 'HTML'],
  'front-back': ['app/checkout/page.tsx', 'app/api/orders/route.ts', 'Supabase · orders'],
  project: ['package.json', 'Next.js', 'app/'],
  folders: ['app/ · routes', 'components/ · UI', 'lib/ · helpers', 'public/ · images'],
  page: ['/boutique', 'app/boutique/page.tsx', 'BoutiqueClient'],
  layout: ['app/layout.tsx', 'CartProvider', 'children'],
  component: ['product', 'ProductCard', 'JSX'],
  jsx: ['ProductCard', 'return', 'JSX', 'HTML'],
  style: ['className', 'Tailwind / CSS', 'Navigateur / Browser'],
  props: ['product', '<ProductCard product={product} />', 'product.name'],
  state: ['useState', 'items', 'setItems', 'React'],
  action: ['Checkout', 'POST /api/orders/', 'create_commerce_order', 'orders', 'Admin'],
};

export default function LessonMap({ id, lang }: { id: string; lang: CourseLanguage }) {
  const steps = maps[id];
  if (!steps) return null;
  const title: Text = ['Le fil à retenir', 'The connection to remember', 'الرابط الذي يجب تذكره'];
  return <figure className={styles.lessonMap}>
    <figcaption>{text(title, lang)}</figcaption>
    <ol>{steps.map((step, index) => <li key={step}>
      <code dir="ltr">{step}</code>
      {index < steps.length - 1 && <span aria-hidden="true">↓</span>}
    </li>)}</ol>
  </figure>;
}
