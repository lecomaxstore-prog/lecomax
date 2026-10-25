import React from 'react';
import * as UI from '../../components/UI';
import { useSchool } from '../../store/School';

const arabic: Record<string, string> = {
  'Explain Simply': 'شرح مبسّط',
  'Explain in Depth': 'شرح معمّق',
  'Show Me Visually': 'شرح بصري',
  'How Does It Work?': 'كيف يعمل؟',
  'What’s Inside?': 'ماذا يوجد في الداخل؟',
  'Interactive Experiment': 'تجربة تفاعلية',
  'Ask AI Teacher': 'اسأل المعلّم الذكي',
  'Challenge My Knowledge': 'اختبر معرفتي',
  'Discovery player': 'رحلة الاكتشاف',
  'Loading saved journey…': 'جارٍ تحميل رحلتك المحفوظة…',
  'Progress needs attention': 'تعذّر قراءة التقدّم',
  'Open backup settings': 'فتح إعدادات النسخ الاحتياطي',
  'Saved discovery data could not be read. It is preserved and has not been replaced.':
    'تعذّر قراءة بيانات الاكتشاف المحفوظة. احتفظنا بها دون استبدالها.',
  'Journey not found': 'الرحلة غير موجودة',
  'This guided journey is unavailable.': 'هذه الرحلة غير متاحة.',
  'Explore available discoveries': 'استكشف الرحلات المتاحة',
  'All discoveries': 'جميع الاكتشافات',
  'Bookmark journey': 'حفظ الرحلة',
  'Bookmarked · remove': 'الرحلة محفوظة · إلغاء الحفظ',
  'Changes Made': 'سجلّ التغييرات',
  'Retry saving progress': 'إعادة محاولة حفظ التقدّم',
  'DISCOVER · EXPERIMENT · UNDERSTAND': 'اكتشف · جرّب · افهم',
  Step: 'الخطوة',
  of: 'من',
  completed: 'مكتملة',
  'Completion = an experiment interaction + a correct checkpoint. Progress:':
    'تكتمل الخطوة بعد تجربة تفاعلية وإجابة صحيحة. حالة الحفظ:',
  saved: 'محفوظ',
  saving: 'جارٍ الحفظ',
  loading: 'جارٍ التحميل',
  error: 'تعذّر الحفظ',
  'See the calculation': 'شاهد الحساب',
  'Try it ·': 'جرّب بنفسك ·',
  'Reset experiment values': 'إعادة قيم التجربة',
  'recorded input changes · Reset keeps your checkpoint history.':
    'تغييرات مسجّلة في المدخلات · إعادة القيم لا تحذف سجلّ إجاباتك.',
  'Challenge my understanding': 'اختبر فهمي',
  'Checkpoint · apply the idea': 'اختبار قصير · طبّق الفكرة',
  'Check answer': 'تحقّق من الإجابة',
  'Show a hint': 'أظهر تلميحًا',
  'Correct.': 'إجابة صحيحة.',
  'Not yet.': 'حاول مرة أخرى.',
  'Last answer:': 'آخر إجابة:',
  '· Attempts:': '· عدد المحاولات:',
  '· First attempt:': '· المحاولة الأولى:',
  correct: 'صحيحة',
  'needs revision': 'تحتاج إلى مراجعة',
  'Assisted/repeated practice': 'تدريب متكرّر أو بمساعدة',
  'First unassisted attempt': 'المحاولة الأولى دون مساعدة',
  'Review due': 'موعد المراجعة',
  '. A checkpoint is limited evidence, not mastery certification.':
    '. هذا الاختبار مؤشر محدود للفهم وليس شهادة إتقان.',
  'Try changing an experiment input to complete this step.':
    'غيّر أحد مدخلات التجربة لإكمال هذه الخطوة.',
  'The idea, simply': 'الفكرة ببساطة',
  'Hide technical details': 'إخفاء التفاصيل التقنية',
  'Expand technical details': 'عرض التفاصيل التقنية',
  'A closer look': 'نظرة أعمق',
  'Follow the mechanism': 'تتبّع آلية العمل',
  'Test the mechanism': 'جرّب آلية العمل',
  'Explore the components': 'استكشف المكوّنات',
  'Functional concepts, not a physical engineering or anatomical drawing.':
    'هذه مفاهيم وظيفية مبسّطة وليست رسمًا هندسيًا أو تشريحيًا دقيقًا.',
  'Ask about this component': 'اسأل عن هذا المكوّن',
  'Your teacher knows this step': 'معلّمك يتابع هذه الخطوة',
  'Context includes the active step, experiment input, checkpoint result and preferred difficulty. AI requires the authenticated online service; generated explanations may contain errors.':
    'يتلقّى المعلّم الخطوة الحالية ومدخل التجربة ونتيجة الاختبار ومستوى الصعوبة المفضّل. تحتاج الخدمة إلى اتصال وتسجيل دخول، وقد تتضمّن الإجابات أخطاء.',
  'Ask about this step': 'اكتب سؤالك عن هذه الخطوة',
  'Ask my question': 'أرسل سؤالي',
  'Explain differently': 'اشرح بطريقة أخرى',
  'Find my misconception': 'ساعدني على اكتشاف سوء الفهم',
  'Give a real-life example': 'أعطني مثالًا من الحياة',
  'Ask me a follow-up question': 'اسألني سؤالًا يعمّق فهمي',
  'Previous step': 'الخطوة السابقة',
  'Next step': 'الخطوة التالية',
  'Review journey': 'مراجعة الرحلة',
  'Journey checkpoints completed': 'أكملت اختبارات الرحلة',
  'You explored every model and passed each check. Return for retrieval practice; these checks do not establish comprehensive mastery.':
    'جرّبت جميع النماذج وأجبت عن الاختبارات. عُد لاحقًا لتسترجع ما تعلّمته؛ هذه الاختبارات لا تثبت الإتقان الشامل.',
  'Revision queue': 'مراجعاتك القادمة',
  'Incorrect answers and due checkpoints appear here. Prior errors are retained after corrections.':
    'تظهر هنا الإجابات غير الصحيحة والاختبارات التي حان موعد مراجعتها. يبقى سجلّ الأخطاء محفوظًا بعد التصحيح.',
  'Source & model limits': 'المصدر وحدود النموذج',
  'Continue exploring': 'واصل الاستكشاف',
  'Decision threshold': 'عتبة القرار',
  Weight: 'الوزن',
  'Class A in 100 examples': 'عدد أمثلة الفئة أ من أصل ١٠٠',
  'Parallel workers': 'وحدات التنفيذ المتوازي',
  'Optimizer updates': 'تحديثات التحسين',
  'Second token score': 'درجة الرمز الثاني',
  Temperature: 'درجة الحرارة',
  'Group A share': 'حصة الفئة أ',
  Input: 'المدخل',
  'Weighted sum': 'المجموع الموزون',
  'ReLU output': 'ناتج ReLU',
  Score: 'الدرجة',
  Threshold: 'العتبة',
  'Spam decision (1=yes)': 'مزعجة؟ (١ = نعم)',
  'Class A count': 'عدد الفئة أ',
  'Class B count': 'عدد الفئة ب',
  'Majority baseline %': 'تخمين الأكثرية ٪',
  Tasks: 'المهام',
  Workers: 'وحدات التنفيذ',
  'Ideal rounds': 'الجولات المثالية',
  Prediction: 'التنبؤ',
  'Squared error': 'مربع الخطأ',
  'Token A weight': 'وزن الرمز أ',
  'Token B weight': 'وزن الرمز ب',
  'Mixed value': 'القيمة الممزوجة',
  '“cat” probability': 'احتمال «قط»',
  '“dog” probability': 'احتمال «كلب»',
  '“bird” probability': 'احتمال «طائر»',
  'Group A accuracy %': 'دقّة الفئة أ ٪',
  'Group B accuracy %': 'دقّة الفئة ب ٪',
  'Overall accuracy %': 'الدقّة الإجمالية ٪',
  'Could not open the source. Check your connection and retry.':
    'تعذّر فتح المصدر. تحقّق من الاتصال ثم أعد المحاولة.',
  'Tutor session limit reached. Open Tutor to manage your 20 saved sessions.':
    'وصلت إلى الحدّ الأقصى للجلسات. افتح المعلّم لإدارة جلساتك العشرين المحفوظة.',
};
export function discoveryText(text: string, language: string): string {
  if (language !== 'ar') return text;
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (arabic[normalized]) return text.replace(text.trim(), arabic[normalized]);
  for (const [prefix, translated] of [
    ['Increase ', 'زيادة '],
    ['Decrease ', 'تقليل '],
    ['Review: ', 'مراجعة: '],
    ['Related: ', 'موضوع مرتبط: '],
  ])
    if (text.startsWith(prefix!))
      return translated + discoveryText(text.slice(prefix!.length), language);
  return text;
}
export function Label({ children, ...props }: React.ComponentProps<typeof UI.Label>) {
  const { state } = useSchool();
  return (
    <UI.Label {...props}>
      {React.Children.map(children, (child) =>
        typeof child === 'string' ? discoveryText(child, state.language) : child,
      )}
    </UI.Label>
  );
}
export function Button(props: React.ComponentProps<typeof UI.Button>) {
  const { state } = useSchool();
  return <UI.Button {...props} title={discoveryText(props.title, state.language)} />;
}
export function Page(props: React.ComponentProps<typeof UI.Page>) {
  const { state } = useSchool();
  return <UI.Page {...props} title={discoveryText(props.title, state.language)} />;
}
export function Field(props: React.ComponentProps<typeof UI.Field>) {
  const { state } = useSchool();
  return (
    <UI.Field {...props} placeholder={discoveryText(props.placeholder || '', state.language)} />
  );
}
