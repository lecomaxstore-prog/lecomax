'use client';
import { useRef, useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { lessons } from './lessons';
import { text, type Text } from './types';
import { dueReviews, type Progress } from './progress';
import { BACKUP_LIMIT, makeLearningBackup, mergeLearningBackup, parseLearningBackup } from './backup';
import styles from './Learning.module.css';

const ids = lessons.map(lesson => lesson.id);
const goals: { title: Text; ids: string[] }[] = [
  { title: ['Comprendre les fichiers', 'Understand the files', 'افهم الملفات'], ids: ['project', 'folders', 'page'] },
  { title: ['Modifier ce que je vois', 'Change what I see', 'غيّر ما تراه'], ids: ['jsx', 'style', 'component'] },
  { title: ['Comprendre les boutons et le panier', 'Understand buttons and the cart', 'افهم الأزرار والسلة'], ids: ['props', 'state', 'action'] },
  { title: ['Comprendre navigateur et serveur', 'Understand browser and server', 'افهم المتصفح والخادم'], ids: ['web', 'front-back'] },
];
const download = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function LearningDesk({ lang, progress, update, onOpen, onReview }: {
  lang: CourseLanguage; progress: Progress; update: (change: Partial<Progress>) => void;
  onOpen: (id: string) => void; onReview: (id: string) => void;
}) {
  const t = (value: Text) => text(value, lang);
  const [tab, setTab] = useState<'today' | 'notebook' | 'backup'>('today');
  const [minutes, setMinutes] = useState(15);
  const [query, setQuery] = useState('');
  const [imported, setImported] = useState<Progress | null>(null);
  const [status, setStatus] = useState<Text | null>(null);
  const [reading, setReading] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const readId = useRef(0);
  const due = dueReviews(progress);
  const unfinished = lessons.filter(lesson => !progress.completed.includes(lesson.id));
  const current = unfinished.find(lesson => lesson.id === progress.current);
  const suggestion = current && current.minutes <= minutes ? current : unfinished.find(lesson => lesson.minutes <= minutes);
  const revisit = due[0] || progress.struggles[0] || progress.bookmarks[0] || progress.current;
  const reviewLesson = lessons.find(lesson => lesson.id === revisit) || lessons[0];
  const saved = lessons.filter(lesson => progress.bookmarks.includes(lesson.id) || progress.notes[lesson.id]?.trim());
  const matching = saved.filter(lesson => `${t(lesson.title)} ${progress.notes[lesson.id] || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));

  async function chooseBackup(file?: File) {
    const request = ++readId.current;
    setImported(null); setStatus(null);
    if (!file) { setReading(false); return; }
    setReading(true);
    try {
      if (file.size > BACKUP_LIMIT) throw new Error('TOO_LARGE');
      const restored = parseLearningBackup(await file.text(), ids);
      if (request === readId.current) setImported(restored);
    } catch { if (request === readId.current) setStatus(['Fichier invalide ou trop volumineux. Choisis une sauvegarde de cet atelier (300 Ko maximum).', 'Invalid or oversized file. Choose a backup from this workshop (maximum 300 KB).', 'الملف غير صالح أو كبير جدا. اختر نسخة من هذه الورشة (300 كيلوبايت كحد أقصى).']); }
    finally { if (request === readId.current) setReading(false); if (picker.current) picker.current.value = ''; }
  }
  return <section className={styles.section} aria-label={t(['Mon espace personnel', 'My personal learning desk', 'مساحة تعلّمي الشخصية'])}>
    <h3>{t(['Qu’est-ce qui m’aiderait aujourd’hui ?', 'What would help me today?', 'ماذا يساعدني اليوم؟'])}</h3>
    <div className={styles.actions}>{([
      ['today', ['Ma petite séance', 'My short session', 'جلستي القصيرة']],
      ['notebook', ['Mes favoris et notes', 'My bookmarks and notes', 'مفضلتي وملاحظاتي']],
      ['backup', ['Sauvegarder mon travail', 'Back up my learning', 'احفظ نسخة من تعلّمي']],
    ] as [typeof tab, Text][]).map(([value, label]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{t(label)}</button>)}</div>
    {tab === 'today' && <div>
      <p>{t(['Choisis le temps dont tu disposes. Les durées sont indicatives ; tu peux t’arrêter et reprendre.', 'Choose the time you have. Durations are estimates; you can stop and return.', 'اختر الوقت المتاح. المدد تقريبية؛ يمكنك التوقف والعودة.'])}</p>
      <div className={styles.actions} role="group" aria-label={t(['Temps disponible', 'Available time', 'الوقت المتاح'])}>{[5, 15, 30].map(value => <button key={value} type="button" aria-pressed={minutes === value} onClick={() => setMinutes(value)}>{value} min</button>)}</div>
      <div className={styles.note}><strong>{suggestion ? t(suggestion.title) : t(reviewLesson.title)}</strong><p>{suggestion ? t(suggestion.goal) : t(['En cinq minutes, rappelle-toi une idée et essaie une question. Tu n’as pas besoin de finir toute la leçon.', 'Use a short session to recall one idea and try a question. You do not need to finish the whole lesson.', 'استعمل جلسة قصيرة لتذكّر فكرة وتجربة سؤال. لا تحتاج إنهاء الدرس كله.'])}</p><button type="button" onClick={() => suggestion ? onOpen(suggestion.id) : onReview(reviewLesson.id)}>{suggestion ? t(['Ouvrir cette leçon', 'Open this lesson', 'افتح هذا الدرس']) : t(['Réviser une idée', 'Review one idea', 'راجع فكرة'])} →</button>{minutes === 30 && <p>{t(['Après la leçon, prends quelques minutes pour la reformuler dans ton carnet et essayer une petite modification en local.', 'After the lesson, take a few minutes to explain it in your notebook and try a small local change.', 'بعد الدرس خذ بضع دقائق لشرحه في دفترك وتجربة تغيير صغير محليا.'])}</p>}</div>
      <details><summary>{t(['Je préfère choisir mon objectif', 'I prefer to choose my goal', 'أفضل اختيار هدفي'])}</summary>{goals.map(goal => <details key={goal.ids[0]}><summary>{t(goal.title)}</summary><ol>{goal.ids.map(id => { const lesson = lessons.find(item => item.id === id)!; return <li key={id}><button type="button" onClick={() => onOpen(id)}>{progress.completed.includes(id) ? '✓ ' : ''}{t(lesson.title)}</button></li>; })}</ol></details>)}</details>
    </div>}
    {tab === 'notebook' && <div>
      <p>{t(['Ajoute une leçon aux favoris depuis son en-tête. Tes notes de leçon sont réunies ici.', 'Bookmark a lesson from its header. Your lesson notes are collected here.', 'أضف الدرس للمفضلة من عنوانه. تجد ملاحظات الدروس مجتمعة هنا.'])}</p>
      <label>{t(['Rechercher dans mon carnet', 'Search my notebook', 'ابحث في دفتري'])}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {!matching.length && <p role="status">{t(['Aucune note ou leçon favorite correspondante. Ouvre une leçon pour commencer ton carnet.', 'No matching notes or bookmarks. Open a lesson to start your notebook.', 'لا ملاحظات أو مفضلة مطابقة. افتح درسا لتبدأ دفترك.'])}</p>}
      {matching.map(lesson => <article key={lesson.id} className={styles.note}><h4>{t(lesson.title)}</h4>{progress.notes[lesson.id] && <p className="whitespace-pre-wrap">{progress.notes[lesson.id]}</p>}<div className={styles.actions}><button type="button" onClick={() => onOpen(lesson.id)}>{t(['Reprendre cette leçon', 'Return to this lesson', 'ارجع لهذا الدرس'])}</button>{progress.bookmarks.includes(lesson.id) && <button type="button" onClick={() => update({ bookmarks: progress.bookmarks.filter(id => id !== lesson.id) })}>{t(['Retirer des favoris', 'Remove bookmark', 'احذف من المفضلة'])}</button>}</div></article>)}
      {!!saved.length && <button type="button" onClick={() => download(saved.map(lesson => `${t(lesson.title)}\n${lesson.file}\n${progress.notes[lesson.id] || ''}`).join('\n\n'), 'lecomax-lesson-notes.txt', 'text/plain;charset=utf-8')}>{t(['Télécharger mon carnet', 'Download my notebook', 'حمّل دفتري'])}</button>}
    </div>}
    {tab === 'backup' && <div>
      <p>{t(['Cette sauvegarde contient la progression, les favoris et les notes des 12 premières leçons et des projets de cet atelier. Les autres cours, les missions pratiques et les conversations IA ont leur propre stockage et ne sont pas inclus.', 'This backup includes progress, bookmarks and notes for the first 12 lessons and this workshop’s projects. Other courses, practical missions and AI conversations have separate storage and are not included.', 'تشمل النسخة التقدم والمفضلة والملاحظات للدروس الاثني عشر الأولى ومشاريع هذه الورشة. الدورات الأخرى والمهام العملية ومحادثات الذكاء غير مشمولة.'])}</p>
      <div className={styles.actions}><button type="button" onClick={() => download(makeLearningBackup(progress, ids), 'lecomax-learning-backup.json', 'application/json')}>{t(['Télécharger une sauvegarde', 'Download a backup', 'حمّل نسخة احتياطية'])}</button><button type="button" disabled={reading} onClick={() => picker.current?.click()}>{t(['Ouvrir une sauvegarde', 'Open a backup', 'افتح نسخة احتياطية'])}</button></div>
      <input ref={picker} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label={t(['Fichier de sauvegarde', 'Backup file', 'ملف النسخة الاحتياطية'])} onChange={event => void chooseBackup(event.target.files?.[0])} />
      <p className={styles.muted}>{t(['Le fichier est lu sur ton appareil, sans envoi au serveur. Garde-le dans un endroit privé si tes notes sont personnelles.', 'The file is read on your device without uploading it. Keep it somewhere private if your notes are personal.', 'يُقرأ الملف على جهازك دون رفعه. احتفظ به في مكان خاص إذا كانت ملاحظاتك شخصية.'])}</p>
      {imported && <div className={styles.note}><p>{imported.completed.length} {t(['leçons terminées dans cette sauvegarde', 'completed lessons in this backup', 'دروس مكتملة في هذه النسخة'])} · {imported.bookmarks.length} {t(['favoris', 'bookmarks', 'مفضلة'])}</p><p>{t(['Ajouter la progression manquante. Tes notes actuelles et ta place restent prioritaires en cas de différence.', 'Add missing progress. Your current notes and place take priority when they differ.', 'أضف التقدم الناقص. تبقى الأولوية لملاحظاتك الحالية ومكانك عند الاختلاف.'])}</p><div className={styles.actions}><button type="button" onClick={() => { update(mergeLearningBackup(progress, imported, ids)); setImported(null); setStatus(['Sauvegarde fusionnée. Tes notes actuelles sont conservées.', 'Backup merged. Your current notes are preserved.', 'تم دمج النسخة مع الاحتفاظ بملاحظاتك الحالية.']); }}>{t(['Fusionner cette sauvegarde', 'Merge this backup', 'ادمج هذه النسخة'])}</button><button type="button" onClick={() => setImported(null)}>{t(['Annuler', 'Cancel', 'إلغاء'])}</button></div></div>}
      <p role="status">{reading ? t(['Lecture…', 'Reading…', 'قراءة…']) : status ? t(status) : ''}</p>
    </div>}
  </section>;
}
