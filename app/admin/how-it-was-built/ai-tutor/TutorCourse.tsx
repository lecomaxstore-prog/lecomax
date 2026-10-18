"use client";
import { useState } from "react";
import { TUTOR_COURSE, TUTOR_LESSONS, recommendTutorLesson, type TutorLesson } from "@/lib/ai-tutor-course";
import type { TutorProgress } from "@/lib/ai-tutor";
import styles from "./Tutor.module.css";

export default function TutorCourse({ completed, progress, disabled, onChoose, onComplete }: {
  completed: string[]; progress: TutorProgress[]; disabled: boolean;
  onChoose: (lesson: TutorLesson) => void; onComplete: (id: string, value: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const recommended = recommendTutorLesson(completed, progress);
  const count = TUTOR_LESSONS.filter(lesson => completed.includes(lesson.id)).length;
  return <section className={styles.course} aria-label="مسار تطوير الويب">
    <h3>من الصفر إلى بناء موقعك</h3>
    <p>{count} من {TUTOR_LESSONS.length} درسًا أنهيتها · أنت تحدد ما فهمته وجرّبته.</p>
    <progress aria-label="الدروس المكتملة" max={TUTOR_LESSONS.length} value={count}/>
    {recommended && <button className={styles.recommendation} disabled={disabled} onClick={() => onChoose(recommended)}>أفضل خطوة لك الآن ← <bdi>{recommended.title}</bdi><small>نراجع موضوعًا يحتاج تدريبًا، أو نبدأ أول درس لم تكمله.</small></button>}
    <details><summary>استكشف المسار الكامل · ٩ مراحل</summary>
      {TUTOR_COURSE.map((stage, index) => <details key={stage.topic} className={styles.courseStage}>
        <summary>{index + 1}. {stage.title} <small>· {stage.lessons.filter(lesson => completed.includes(lesson.id)).length}/{stage.lessons.length}</small></summary>
        {stage.lessons.map(lesson => <div key={lesson.id} className={styles.lessonRow}>
          <button disabled={disabled} onClick={() => onChoose(lesson)}><bdi>{lesson.title}</bdi><small>ابدأ درسًا صغيرًا ←</small></button>
          <button aria-label={`${completed.includes(lesson.id) ? "إلغاء إكمال" : "أكملت"} ${lesson.title}`} aria-pressed={completed.includes(lesson.id)} disabled={disabled || saving !== null} onClick={async () => { setSaving(lesson.id); try { await onComplete(lesson.id, !completed.includes(lesson.id)); } finally { setSaving(null); } }}>{saving === lesson.id ? "…" : completed.includes(lesson.id) ? "✓ أنهيته" : "أكملته"}</button>
        </div>)}
      </details>)}
    </details>
  </section>;
}
