import type { CourseLanguage } from './course/types';
import { translate } from './course/journey';

const paths = [
  { file: 'app/page.tsx', url: '/', title: ['Accueil', 'Home', 'الرئيسية'], task: ['Repère les composants importés, puis retrouve leur position sur la page d’accueil.', 'Find the imported components, then locate them on the home page.', 'حدد المكونات المستوردة ثم ابحث عن مكانها في الصفحة الرئيسية.'] },
  { file: 'components/ProductCard.tsx', url: '/boutique', title: ['Carte produit', 'Product card', 'بطاقة المنتج'], task: ['Retrouve les données qui affichent le nom, le prix et l’image d’un produit.', 'Find the data used to display a product’s name, price and image.', 'ابحث عن البيانات التي تعرض اسم المنتج وسعره وصورته.'] },
  { file: 'app/admin/dashboard/page.tsx', url: '/admin/dashboard', title: ['Tableau de bord', 'Dashboard', 'لوحة التحكم'], task: ['Retrouve la requête de chargement et les états de chargement, d’erreur et de réussite.', 'Find the loading request and the loading, error and success states.', 'ابحث عن طلب البيانات وحالات التحميل والخطأ والنجاح.'] },
  { file: 'app/api/admin/dashboard/route.ts', url: '/admin/dashboard', title: ['Données du tableau de bord', 'Dashboard data', 'بيانات لوحة التحكم'], task: ['Suis GET : vérification de session, requêtes à la base, puis réponse JSON. Compare avec la page qui reçoit ces données.', 'Follow GET: session check, database queries, then the JSON response. Compare with the page receiving this data.', 'تتبع GET: التحقق من الجلسة ثم استعلامات قاعدة البيانات ثم رد JSON. قارن مع الصفحة التي تستقبل البيانات.'] },
  { file: 'app/admin/how-it-was-built/learning/LearningDashboard.tsx', url: '/admin/how-it-was-built#site', title: ['Ton atelier', 'Your workshop', 'ورشتك'], task: ['Retrouve le titre, la prochaine leçon et onContinue. Explique ce qui arrive quand tu touches le bouton.', 'Find the title, next lesson and onContinue. Explain what happens when you tap the button.', 'ابحث عن العنوان والدرس التالي وonContinue. اشرح ما يحدث عند الضغط على الزر.'] },
  { file: 'app/admin/how-it-was-built/learning/Learning.module.css', url: '/admin/how-it-was-built#site', title: ['Le design mobile', 'Mobile design', 'تصميم الهاتف'], task: ['Cherche max-width:767px. Compare les espacements et les tailles de texte sur téléphone et ordinateur.', 'Search for max-width:767px. Compare spacing and text sizes on phone and desktop.', 'ابحث عن max-width:767px. قارن المسافات وحجم النص على الهاتف والحاسوب.'] },
] as const;

export default function SourceLearningPaths({ lang, onOpen }: { lang: CourseLanguage; onOpen: (path: string) => void }) {
  const t = (values: readonly [string, string, string]) => translate(lang, ...values);
  return <details className="rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4" open>
    <summary className="min-h-11 cursor-pointer text-sm font-bold text-emerald-950">{t(['Apprendre avec les vrais fichiers de mon site', 'Learn with my site’s real files', 'تعلم من ملفات موقعي الحقيقية'])}</summary>
    <p className="mb-3 text-sm leading-6 text-emerald-900/80">{t(['Observe la page, lis son code, puis explique le lien entre les deux. Choisis une partie pour commencer.', 'Observe the page, read its code, then explain the connection. Choose a part to begin.', 'شاهد الصفحة واقرأ كودها ثم اشرح العلاقة بينهما. اختر جزءا للبدء.'])}</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {paths.map(item => <article key={item.file} className="min-w-0 rounded-xl border border-emerald-900/10 bg-white p-3">
        <h3 className="text-sm font-bold text-emerald-950">{t(item.title)}</h3>
        <p dir="ltr" className="mt-1 break-all font-mono text-[11px] text-neutral-500">{item.file}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-700">{t(item.task)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onOpen(item.file)} className="min-h-11 rounded-lg bg-emerald-900 px-3 text-xs font-bold text-white">{t(['Étudier ce fichier', 'Study this file', 'ادرس هذا الملف'])}</button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-emerald-900 underline">{t(['Voir la page ↗', 'View page ↗', 'شاهد الصفحة ↗'])}</a>
        </div>
      </article>)}
    </div>
  </details>;
}
