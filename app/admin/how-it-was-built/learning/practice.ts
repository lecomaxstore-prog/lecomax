import type { Text } from './types';

export type LabKind = 'route' | 'product' | 'spacing' | 'state';
export type LabResult = { kind: LabKind; value: string | number; solved: boolean };
export const labForLesson: Record<string, LabKind> = {
  web: 'route', folders: 'route', page: 'route', component: 'product', jsx: 'product',
  props: 'product', style: 'spacing', state: 'state',
};
export const labs: Record<LabKind, { original: string; solution: string; task: Text; hint: Text; explanation: Text }> = {
  route: {
    original: 'app/boutique/page.tsx', solution: 'app/bonjour/page.tsx',
    task: ['Crée le chemin d’une page /bonjour. Remplace seulement le nom du dossier.', 'Create the file path for /bonjour. Change only the folder name.', 'أنشئ مسار ملف صفحة /bonjour. غيّر اسم المجلد فقط.'],
    hint: ['Garde app/ au début et /page.tsx à la fin.', 'Keep app/ at the start and /page.tsx at the end.', 'احتفظ بـapp/ في البداية و/page.tsx في النهاية.'],
    explanation: ['Dans App Router, le dossier choisit l’adresse. Le fichier page.tsx fournit ce qui s’affiche. Ce simulateur montre l’adresse ; il ne crée pas de fichier.', 'In App Router, the folder chooses the address. page.tsx provides the content. This simulator shows the address; it does not create a file.', 'في App Router يحدد المجلد العنوان ويوفر page.tsx المحتوى. يعرض المحاكي العنوان ولا ينشئ ملفا.'],
  },
  product: {
    original: 'const product = { name: "Mon produit" };', solution: 'const product = { name: "Mon premier site" };',
    task: ['Fais afficher « Mon premier site » dans la carte. Change le texte entre guillemets.', 'Make the card display “Mon premier site”. Change the quoted text.', 'اجعل البطاقة تعرض «Mon premier site». غيّر النص بين علامتي الاقتباس.'],
    hint: ['Garde name et les guillemets. La carte lit product.name.', 'Keep name and the quotes. The card reads product.name.', 'احتفظ بـname وعلامتي الاقتباس. تقرأ البطاقة product.name.'],
    explanation: ['const nomme un objet. name est une information de cet objet. {product.name} dans JSX affiche sa valeur. Modifier les données change le texte sans réécrire la carte.', 'const names an object. name is one property of that object. {product.name} in JSX displays its value. Editing the data changes the text without rewriting the card.', 'تسمي const كائنا وname معلومة فيه. تعرض {product.name} في JSX القيمة. تغيير البيانات يغير النص دون إعادة كتابة البطاقة.'],
  },
  spacing: {
    original: 'className="p-4"', solution: 'className="p-8"',
    task: ['Double l’espace intérieur de la carte : remplace p-4 par p-8.', 'Double the card’s inside spacing: replace p-4 with p-8.', 'ضاعف المسافة الداخلية للبطاقة: استبدل p-4 بـp-8.'],
    hint: ['p signifie padding : la distance entre le bord et le contenu.', 'p means padding: the distance between the border and the content.', 'تعني p الحشو: المسافة بين الحافة والمحتوى.'],
    explanation: ['Dans l’échelle Tailwind par défaut, p-4 vaut 1 rem et p-8 vaut 2 rem. Tu changes l’espace autour du texte, pas son contenu ni les données du produit.', 'On Tailwind’s default scale, p-4 is 1 rem and p-8 is 2 rem. You change space around the text, not its content or the product data.', 'في مقياس Tailwind الافتراضي p-4 تساوي 1 rem وp-8 تساوي 2 rem. تغير المسافة حول النص لا المحتوى أو بيانات المنتج.'],
  },
  state: {
    original: 'setQuantity(1)', solution: 'setQuantity(3)',
    task: ['Affiche une quantité de 3. Donne 3 à la fonction setQuantity.', 'Display a quantity of 3. Pass 3 to setQuantity.', 'اعرض كمية 3. مرر 3 للدالة setQuantity.'],
    hint: ['Le nombre entre parenthèses est la nouvelle valeur demandée.', 'The number in parentheses is the new value you request.', 'الرقم بين القوسين هو القيمة الجديدة المطلوبة.'],
    explanation: ['Comme setItems dans ton panier, une fonction de mise à jour demande à React un nouvel affichage. Ici, la quantité est une valeur de démonstration, sans lien avec ton vrai panier.', 'Like setItems in your cart, an update function asks React to render a new value. Here quantity is demo data, separate from your actual cart.', 'مثل setItems في سلتك تطلب دالة التحديث من React عرض قيمة جديدة. الكمية هنا تجريبية ولا ترتبط بسلتك الحقيقية.'],
  },
};

/** Recognize four bounded exercise formats; never evaluate JavaScript, JSX or HTML. */
export function previewLab(kind: LabKind, code: string): LabResult | null {
  if (code.length > 240) return null;
  let value: string | number;
  if (kind === 'route') {
    const match = /^\s*app\/([a-z][a-z0-9-]{0,39})\/page\.tsx\s*$/.exec(code);
    if (!match) return null;
    value = `/${match[1]}`;
  } else if (kind === 'product') {
    const match = /^\s*const\s+product\s*=\s*\{\s*name\s*:\s*"([^"\r\n<>]{1,60})"\s*\}\s*;?\s*$/.exec(code);
    if (!match) return null;
    value = match[1];
  } else if (kind === 'spacing') {
    const match = /^\s*className\s*=\s*"p-(4|8)"\s*$/.exec(code);
    if (!match) return null;
    value = Number(match[1]);
  } else {
    const match = /^\s*setQuantity\(\s*([1-9])\s*\)\s*;?\s*$/.exec(code);
    if (!match) return null;
    value = Number(match[1]);
  }
  const target = { route: '/bonjour', product: 'Mon premier site', spacing: 8, state: 3 }[kind];
  return { kind, value, solved: value === target };
}
