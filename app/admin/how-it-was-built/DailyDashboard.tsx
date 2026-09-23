"use client";

import { DAILY_LESSONS, dailyText } from "./course/daily-lessons";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";
import type { DailyProgress } from "./course/daily-progress";
import styles from "./DailyLearning.module.css";

type Props = { lang: CourseLanguage; selected: number; progress: DailyProgress; explored: number };

export function DailyDashboard({ lang, selected, explored, onStart }: Props & { onStart: () => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  return <header className={styles.hero}>
    <div className={styles.heroCopy}>
      <p className={styles.eyebrow}><span /> L’ECOMAX <span className={styles.separator}>/</span> {t("ACADÉMIE", "ACADEMY", "الأكاديمية")}</p>
      <h2>{t("Comprendre le code.\nConstruire avec confiance.", "Understand the code.\nBuild with confidence.", "افهم الكود.\nوابنِ بثقة.")}</h2>
      <p className={styles.heroDescription}>{t("Apprends avec les vrais fichiers de ta boutique, une notion et un exercice à la fois.", "Learn with your shop’s real files, one concept and one exercise at a time.", "تعلّم من ملفات متجرك الحقيقية، فكرة وتمرينًا في كل مرة.")}</p>
      <div className={styles.heroMeta}><span>{t("Parcours débutant", "Beginner pathway", "مسار المبتدئين")}</span><span>14 {t("leçons", "lessons", "درسًا")}</span><span>10–15 min / {t("séance", "session", "جلسة")}</span></div>
      <button type="button" onClick={onStart} className={styles.startButton}>{t("Reprendre ma leçon", "Continue my lesson", "متابعة درسي")} <span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span></button>
    </div>
    <div className={styles.courseCard}>
      <div className={styles.courseCardTop}><span>{t("TON PARCOURS", "YOUR PATHWAY", "مسارك")}</span><span aria-hidden="true">↗</span></div>
      <strong>{String(selected + 1).padStart(2, "0")}<small> / 14</small></strong>
      <p>{dailyText(lang, DAILY_LESSONS[selected].title)}</p>
      <div className={styles.progressTrack} role="progressbar" aria-label={t("Leçons travaillées", "Lessons studied", "الدروس المدروسة")} aria-valuemin={0} aria-valuemax={14} aria-valuenow={explored}><span style={{ width: `${explored / 14 * 100}%` }} /></div>
      <span className={styles.progressCaption}>{explored} / 14 {t("leçons travaillées", "lessons studied", "درسًا مدروسًا")}</span>
    </div>
  </header>;
}

export function LessonOutline({ lang, selected, progress, explored, onChoose }: Props & { onChoose: (index: number) => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const groups = [t("Découvrir les bases", "Discover the foundations", "اكتشف الأساسيات"), t("Comprendre le fonctionnement", "Understand how it works", "افهم طريقة العمل"), t("Construire et progresser", "Build and grow", "ابنِ وتقدّم")];
  return <aside className={styles.outline} aria-label={t("Programme du parcours", "Course curriculum", "برنامج المسار")}>
    <div className={styles.outlineHeading}><span>{t("Le programme", "The curriculum", "البرنامج")}</span><span>{explored}/14</span></div>
    <label htmlFor="daily-lesson-choice" className="sr-only">{t("Choisir une leçon", "Choose a lesson", "اختر درسًا")}</label>
    <select id="daily-lesson-choice" value={selected} onChange={event => onChoose(Number(event.target.value))} className={styles.mobileSelect}>{DAILY_LESSONS.map((lesson, index) => <option key={lesson.id} value={index}>{index + 1}. {dailyText(lang, lesson.title)}{progress[lesson.id]?.trainedDays?.length || progress[lesson.id]?.completedOn ? " ✓" : ""}</option>)}</select>
    <div className={styles.lessonList}>{DAILY_LESSONS.map((lesson, index) => {
      const studied = Boolean(progress[lesson.id]?.trainedDays?.length || progress[lesson.id]?.completedOn);
      return <div key={lesson.id}>
        {[0, 5, 10].includes(index) && <p className={styles.groupLabel}>{groups[index === 0 ? 0 : index === 5 ? 1 : 2]}</p>}
        <button type="button" onClick={() => onChoose(index)} aria-current={index === selected ? "true" : undefined} className={styles.lessonLink}>
          <span className={studied ? styles.studiedNumber : styles.lessonNumber}>{studied ? "✓" : String(index + 1).padStart(2, "0")}</span>
          <span>{dailyText(lang, lesson.title)}<small>{studied ? t("Travaillée", "Studied", "تمت دراسته") : index === selected ? t("En cours", "In progress", "قيد التعلّم") : t("À découvrir", "To explore", "للاكتشاف")}</small></span>
          {index === selected && <span className={styles.activeDot} aria-hidden="true" />}
        </button>
      </div>;
    })}</div>
    <p className={styles.outlineFoot}>{t("Avance à ton rythme. Tu peux revoir chaque leçon à tout moment.", "Go at your own pace. Revisit any lesson whenever you need.", "تقدّم حسب وتيرتك. يمكنك مراجعة أي درس في أي وقت.")}</p>
  </aside>;
}
