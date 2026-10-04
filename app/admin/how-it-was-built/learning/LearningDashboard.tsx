import type { CourseLanguage } from '../course/types';
import { text, type Lesson, type Text } from './types';
import { roadmap } from './resources';
import styles from './Learning.module.css';

export default function LearningDashboard({ lang, lesson, completed, total, streak, onContinue }: {
  lang: CourseLanguage; lesson: Lesson; completed: number; total: number;
  streak: number; onContinue: () => void;
}) {
  const t = (value: Text) => text(value, lang);
  return <header className={styles.dashboard}>
    <div className={styles.introduction}>
      <p className={styles.eyebrow}>{t(['TON ATELIER PERSONNEL', 'YOUR PERSONAL WORKSHOP', 'ورشتك الشخصية'])}</p>
      <h2>{t(['Comprendre le code.\nConstruire avec confiance.', 'Understand the code.\nBuild with confidence.', 'افهم الكود.\nوابنِ بثقة.'])}</h2>
      <p className={styles.introCopy}>{t(['Apprends avec ton vrai site, une notion à la fois.', 'Learn with your real website, one concept at a time.', 'تعلم من موقعك الحقيقي، مفهوما بعد آخر.'])}</p>
    </div>
    <div className={styles.continueLesson}>
      <div className={styles.lessonMeta}>
        <span>{t([completed === total ? 'À REVOIR À TON RYTHME' : 'TA PROCHAINE ÉTAPE', completed === total ? 'REVIEW AT YOUR PACE' : 'YOUR NEXT STEP', 'خطوتك التالية'])}</span>
        <span>≈ {lesson.minutes} min</span>
      </div>
      <p className={styles.chapterLabel}>{String(lesson.level + 1).padStart(2, '0')} / {t(roadmap[lesson.level].title)}</p>
      <h3>{t(lesson.title)}</h3>
      <p>{t(lesson.goal)}</p>
      <button type="button" className={styles.primary} onClick={onContinue}>
        {t([completed ? 'Reprendre mon parcours' : 'Commencer ma première leçon', completed ? 'Continue learning' : 'Start my first lesson', completed ? 'تابع التعلم' : 'ابدأ درسي الأول'])}
        <span aria-hidden="true">{lang === 'ar' ? '←' : '→'}</span>
      </button>
    </div>
    <div className={styles.progressOverview}>
      <div><span>{t(['Mon parcours', 'My progress', 'تقدمي'])}</span><strong>{completed}<span> / {total} {t(['leçons', 'lessons', 'درسا'])}</span></strong></div>
      <progress max={total} value={completed} aria-label={t(['Leçons terminées', 'Completed lessons', 'الدروس المكتملة'])}/>
      <p>{streak > 0 ? `${streak} ${t(['jour(s) de pratique consécutifs', 'consecutive practice day(s)', 'أيام متتالية من التعلم'])}` : t(['Un petit pas aujourd’hui suffit.', 'One small step today is enough.', 'خطوة صغيرة اليوم تكفي.'])}</p>
    </div>
  </header>;
}
