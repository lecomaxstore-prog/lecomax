import type { LabKind } from './journeys';
import { labResult } from './labs';
export function localizedLabResult(kind: LabKind, value: number, language: string) {
  const result = labResult(kind, value);
  if (language !== 'ar') return result;
  const explanations: Partial<Record<LabKind, string>> = {
    threshold: `درجة الرسالة ٦، والعتبة ${value}. النتيجة: ${value <= 6 ? 'تُصنَّف مزعجة' : 'لا تُصنَّف مزعجة'}.`,
    neuron: `نضرب المدخل ٢ في الوزن ${value} ثم نضيف ١. نطبّق ReLU: نحتفظ بالناتج إن كان موجبًا، وإلّا نُخرج صفرًا.`,
    data: `من أصل ١٠٠ مثال: ${value} للفئة أ و${100 - value} للفئة ب. التخمين الدائم للفئة الأكثر عددًا يصيب ${Math.max(value, 100 - value)}٪، لكنه يخطئ في كل أمثلة الفئة الأقل عددًا.`,
    parallel: `نوزّع ١٦ مهمة مستقلة بالتساوي قدر الإمكان على ${value} وحدات. نحتاج إلى ${Math.ceil(16 / value)} جولات مثالية.`,
    training: `بعد ${value} تحديثات، يقترب الوزن من ٣ والتنبؤ من الهدف ٦. الأرقام أدناه تعرض الوزن والتنبؤ ومربع الخطأ.`,
    attention: `تحوّل softmax الدرجتين ٠ و${value} إلى وزنين مجموعهما واحد، ثم نمزج القيمتين ٢ و٨ باستخدامهما.`,
    generation: `نقسم الدرجات التعليمية ٢ و١ و٠ على درجة الحرارة ${value} قبل تطبيق softmax. ارتفاع الحرارة يجعل الاحتمالات أكثر تقاربًا.`,
    evaluation: `حصة الفئة أ ${value}٪ بدقّة ٩٠٪، وحصة الفئة ب ${100 - value}٪ بدقّة ٤٠٪. يتغيّر المتوسط دون تغيّر دقّة أي فئة.`,
  };
  const limitations: Partial<Record<LabKind, string>> = {
    threshold:
      'هذه درجة مصطنعة وليست كاشفًا حقيقيًا للرسائل المزعجة. تغيير العتبة لا يدرّب النموذج.',
    neuron: 'عُقدة رياضية واحدة بانحياز ثابت؛ لا نحاكي تشريح الدماغ أو شبكة مدرّبة.',
    data: 'حساب مرجعي تعليمي، لا نتيجة نموذج حقيقي. توازن البيانات وحده لا يضمن الإنصاف.',
    parallel: 'نتجاهل تكاليف الذاكرة والجدولة والنقل. هذه ليست نتيجة اختبار سرعة لمعالج حقيقي.',
    training: 'انحدار تدرّجي على مثال عددي مصطنع واحد. لا ندرّب نموذجًا لغويًا ولا نقيس التعميم.',
    attention:
      'درجتان وقيمتان عدديتان مصطنعتان. نتجاهل الإسقاطات المتعلّمة والرؤوس المتعددة ومعلومات الموضع.',
    generation:
      'درجات المرشّحات مصطنعة وليست صادرة عن ChatGPT. لا يُرسل أي طلب إلى خدمة ذكاء اصطناعي هنا.',
    evaluation: 'فئتان ونتائج مصطنعة، لا ادّعاء بشأن نموذج حقيقي أو مجموعة سكانية.',
  };
  return {
    ...result,
    explanation: explanations[kind] || result.explanation,
    limitation: limitations[kind] || result.limitation,
  };
}
