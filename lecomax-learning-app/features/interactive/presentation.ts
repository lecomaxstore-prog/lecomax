import type { ToolId } from './model';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type Copy = [string, string, string];
export const studioActions: Record<string, Copy> = {
  Editor: ['Éditeur', 'Editor', 'المحرّر'],
  Output: ['Résultat', 'Output', 'النتيجة'],
  Exercise: ['Exercice', 'Exercise', 'التمرين'],
  Mentor: ['Professeur', 'Mentor', 'المعلّم'],
  'Smaller text': ['Texte plus petit', 'Smaller text', 'تصغير النص'],
  'Larger text': ['Texte plus grand', 'Larger text', 'تكبير النص'],
  'Fullscreen editor': ['Éditeur plein écran', 'Fullscreen editor', 'محرّر بملء الشاشة'],
  'Close fullscreen': ['Quitter le plein écran', 'Close fullscreen', 'إغلاق ملء الشاشة'],
  'Save snapshot': ['Enregistrer une copie', 'Save snapshot', 'حفظ نسخة'],
  'Load snapshot': ['Charger la copie', 'Load snapshot', 'تحميل النسخة'],
  'Reset to example': ['Revenir à l’exemple', 'Reset to example', 'العودة إلى المثال'],
  'Copy code': ['Copier le code', 'Copy code', 'نسخ الكود'],
  'Run code': ['Exécuter', 'Run code', 'شغّل الكود'],
  'Running…': ['Exécution…', 'Running…', 'جارٍ التنفيذ…'],
  'Preview page': ['Aperçu de la page', 'Preview page', 'معاينة الصفحة'],
  'Render React component': [
    'Afficher le composant React',
    'Render React component',
    'عرض مكوّن React',
  ],
  'Run exercise tests': ['Tester l’exercice', 'Run exercise tests', 'اختبر التمرين'],
  'Stop code': ['Arrêter', 'Stop code', 'إيقاف التنفيذ'],
  'Clear output': ['Effacer le résultat', 'Clear output', 'مسح النتيجة'],
  'Copy output': ['Copier le résultat', 'Copy output', 'نسخ النتيجة'],
};
export const toolPresentation: Record<
  ToolId,
  { icon: ComponentProps<typeof Ionicons>['name']; title: Copy; description: Copy }
> = {
  python: {
    icon: 'logo-python',
    title: ['Python Studio', 'Python Studio', 'استوديو Python'],
    description: [
      'Écrivez et exécutez de vrais programmes Python.',
      'Write and run real Python programs.',
      'اكتب برامج Python حقيقية وشغّلها.',
    ],
  },
  javascript: {
    icon: 'logo-javascript',
    title: ['JavaScript Studio', 'JavaScript Studio', 'استوديو JavaScript'],
    description: [
      'Testez vos fonctions et comprenez chaque résultat.',
      'Test your functions and understand each result.',
      'اختبر دوالك وافهم كل نتيجة.',
    ],
  },
  typescript: {
    icon: 'code-slash-outline',
    title: ['TypeScript Studio', 'TypeScript Studio', 'استوديو TypeScript'],
    description: [
      'Explorez les types et le comportement du code.',
      'Explore types and program behavior.',
      'اكتشف الأنواع وسلوك البرامج.',
    ],
  },
  web: {
    icon: 'globe-outline',
    title: ['HTML/CSS Studio', 'HTML/CSS Studio', 'استوديو HTML/CSS'],
    description: [
      'Créez une page et prévisualisez votre travail.',
      'Build a page and preview your work.',
      'أنشئ صفحة وعاين عملك.',
    ],
  },
  sql: {
    icon: 'server-outline',
    title: ['SQL Playground', 'SQL Playground', 'مختبر SQL'],
    description: [
      'Interrogez une base de données de démonstration.',
      'Query a sample shop database.',
      'استعلم عن قاعدة بيانات متجر تجريبية.',
    ],
  },
  react: {
    icon: 'logo-react',
    title: ['React / Next.js', 'React / Next.js', 'React / Next.js'],
    description: [
      'Des composants et des projets guidés.',
      'Components and guided projects.',
      'مكوّنات ومشاريع موجّهة.',
    ],
  },
  math: {
    icon: 'calculator-outline',
    title: ['Labo de maths', 'Math Lab', 'مختبر الرياضيات'],
    description: [
      'Calculez, tracez et explorez les équations.',
      'Calculate, graph and explore equations.',
      'احسب وارسم واستكشف المعادلات.',
    ],
  },
  science: {
    icon: 'planet-outline',
    title: ['Labo de sciences', 'Science Lab', 'مختبر العلوم'],
    description: [
      'Expérimentez et vérifiez vos prédictions.',
      'Experiment and check your predictions.',
      'جرّب وتحقّق من توقّعاتك.',
    ],
  },
  language: {
    icon: 'language-outline',
    title: ['Pratique des langues', 'Language Practice', 'تدريب اللغات'],
    description: [
      'Traduction, mémoire et écoute.',
      'Translation, recall and listening.',
      'الترجمة والتذكّر والاستماع.',
    ],
  },
  quiz: {
    icon: 'checkmark-circle-outline',
    title: ['Quiz', 'Quiz Arena', 'ساحة الاختبارات'],
    description: ['Vérifiez votre compréhension.', 'Check your understanding.', 'تحقّق من فهمك.'],
  },
  cards: {
    icon: 'albums-outline',
    title: ['Cartes mémoire', 'Flashcard Review', 'بطاقات المراجعة'],
    description: [
      'Créez vos cartes et révisez au bon moment.',
      'Create cards and review at the right time.',
      'أنشئ بطاقاتك وراجعها في الوقت المناسب.',
    ],
  },
  board: {
    icon: 'create-outline',
    title: ['Tableau pédagogique', 'AI Whiteboard', 'سبورة التعلّم'],
    description: [
      'Dessinez, annotez et sauvegardez vos idées.',
      'Draw, label and save your ideas.',
      'ارسم أفكارك واشرحها واحفظها.',
    ],
  },
  projects: {
    icon: 'layers-outline',
    title: ['Projets guidés', 'Guided Projects', 'مشاريع موجّهة'],
    description: [
      'Construisez vos compétences, étape par étape.',
      'Build your skills, milestone by milestone.',
      'طوّر مهاراتك، خطوة بخطوة.',
    ],
  },
};
