export const errorExercises = [
  {
    file: 'app/atelier/page.tsx',
    code: 'export default function Page() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count+1)}>{count}</button>;\n}',
    question: [
      'Pourquoi cette page échoue-t-elle ?',
      'Why does this page fail?',
      'لماذا تفشل هذه الصفحة؟',
    ],
    options: [
      [
        'Il manque use client et l’import useState',
        'Missing use client and the useState import',
        'ينقص use client واستيراد useState',
      ],
      ['Le nombre zéro est interdit', 'Zero is forbidden', 'الصفر ممنوع'],
      ['Il faut une base SQL', 'It needs SQL', 'تحتاج SQL'],
    ],
    correct: 0,
    solution: '"use client";\nimport { useState } from "react";\n// Then the component',
    explanation: [
      'Les événements et useState demandent un Client Component dans App Router. Le hook doit aussi être importé.',
      'Events and useState require a Client Component in App Router. The hook also needs an import.',
      'تحتاج الأحداث وuseState إلى Client Component في App Router. يجب استيراد Hook أيضًا.',
    ],
  },
  {
    file: 'lib/example.ts',
    code: 'const response = await fetch("/api/products");\nconst products = response.json();\nreturn products.map(product => product.name);',
    question: [
      'Quelle valeur reçoit products ?',
      'What value does products receive?',
      'ما القيمة التي تستقبلها products؟',
    ],
    options: [
      ['Un tableau', 'An array', 'مصفوفة'],
      ['Une Promise non attendue', 'An unawaited Promise', 'Promise لم ننتظرها'],
      ['Une chaîne', 'A string', 'نص'],
    ],
    correct: 1,
    solution: 'const products = await response.json();',
    explanation: [
      'json() est asynchrone. Attends sa réponse, vérifie response.ok puis valide le format reçu.',
      'json() is asynchronous. Await it, check response.ok and validate the received shape.',
      'json() غير متزامنة. انتظر نتيجتها وتحقق من response.ok ومن شكل البيانات.',
    ],
  },
  {
    file: 'components/Example.tsx',
    code: 'const [items, setItems] = useState([]);\nfunction add(product) { items.push(product); }',
    question: [
      'Pourquoi l’écran ne se met pas à jour ?',
      'Why does the screen not update?',
      'لماذا لا تتحدث الشاشة؟',
    ],
    options: [
      ['Le nom product est mauvais', 'product is a bad name', 'اسم product خاطئ'],
      ['Il faut recharger la page', 'Reload the page', 'أعد تحميل الصفحة'],
      [
        'La mutation ne passe pas par setItems',
        'Mutation bypasses setItems',
        'التعديل لم يمر عبر setItems',
      ],
    ],
    correct: 2,
    solution: 'setItems(previous => [...previous, product]);',
    explanation: [
      'Crée un nouveau tableau via le setter. React reçoit une nouvelle référence et peut afficher le changement.',
      'Create a new array through the setter. React receives a new reference and can render the change.',
      'أنشئ مصفوفة جديدة عبر setter. يستقبل React مرجعًا جديدًا ويستطيع عرض التغيير.',
    ],
  },
];
