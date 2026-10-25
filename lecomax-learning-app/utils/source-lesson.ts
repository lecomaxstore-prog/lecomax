import type { SourceSelection } from './site-learning';
export type SourceEvent = { name: string; code: string; start: number; end: number; calls: string[] };
export type SourceElement = { tag: string; start: number; end: number; attributes: Record<string, string | undefined>; label: string; events: SourceEvent[]; scopes?: number[] };
export type SourceDefinition = { name: string; kind: string; start: number; end: number; state?: string; initial?: string; scope?: number };
export type SourceIndex = { hash: string; elements: SourceElement[]; definitions: SourceDefinition[] };
const normalize = (value = '') => value.replace(/\s+/g, ' ').trim().toLowerCase();
const htmlTag = (tag: string) => tag === 'Link' ? 'a' : tag === 'Image' ? 'img' : tag.toLowerCase();
const pathOnly = (value: string) => value.replace(/^https:\/\/lecomax\.com/, '').split(/[?#]/)[0];

export function matchSourceElement(selection: SourceSelection, source: SourceIndex | undefined) {
  if (!source || !selection.tag) return;
  const ranked = source.elements.filter(element => htmlTag(element.tag) === selection.tag).map(element => {
    let score = 0;
    const attrs = element.attributes;
    if (selection.ariaLabel && normalize(attrs['aria-label']) === normalize(selection.ariaLabel)) score += 12;
    if (selection.elementId && attrs.id === selection.elementId) score += 12;
    if (selection.href && attrs.href && pathOnly(attrs.href) === pathOnly(selection.href)) score += 8;
    if (selection.label && [element.label, attrs.alt, attrs.title, attrs['aria-label']].some(value => !!value && normalize(value) === normalize(selection.label))) score += 6;
    if (selection.line && element.start === selection.line) score += 3;
    return { element, score };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  // A region alone is not proof that a particular handler belongs to the selection.
  if (!best || best.score < 3 || (ranked[1] && ranked[1].score === best.score)) return;
  return { element: best.element, confidence: best.score >= 6 ? 'matched' as const : 'line' as const };
}

export function sourceExcerpt(content: string, start: number, end: number, limit = 14) {
  const lines = content.split('\n');
  const first = Math.max(1, Math.min(start, lines.length));
  const last = Math.min(lines.length, end, first + limit - 1);
  return { start: first, end: last, code: lines.slice(first - 1, last).join('\n'), truncated: end > last };
}

type Language = 'fr' | 'en' | 'ar';
export function describeSourceBehavior(element: SourceElement, source: SourceIndex, language: Language) {
  const t = (fr: string, en: string, ar: string) => ({ fr, en, ar })[language];
  const event = element.events.find(event => event.name === 'onClick') || element.events[0];
  const definitions = event ? [...event.calls, event.code].flatMap(name => {
    const available = source.definitions.filter(definition => definition.name === name && (definition.scope === undefined || definition.scope === -1 || element.scopes?.includes(definition.scope)));
    const rank = (scope?: number) => { const index = element.scopes?.indexOf(scope ?? -1) ?? -1; return index < 0 ? 100000 : index; };
    available.sort((a, b) => rank(a.scope) - rank(b.scope));
    return available[0] ? [available[0]] : [];
  }) : [];
  const definition = definitions[0];
  const steps: string[] = [];
  if (event) {
    steps.push(t(`Ton action déclenche ${event.name}, l’instruction reliée à cet élément.`, `Your action triggers ${event.name}, the instruction attached to this element.`, `إجراؤك يشغّل ${event.name}، وهي التعليمة المرتبطة بهذا العنصر.`));
    for (const definition of definitions) if (definition.kind === 'state') {
      steps.push(t(`Le code appelle ${definition.name}. Cette fonction change « ${definition.state} », une valeur que la page garde en mémoire. Sa valeur initiale est ${definition.initial}.`, `The code calls ${definition.name}. This function changes “${definition.state}”, a value the page remembers. Its initial value is ${definition.initial}.`, `يستدعي الكود ${definition.name}. تغيّر هذه الدالة «${definition.state}»، وهي قيمة تتذكرها الصفحة. قيمتها الأولى ${definition.initial}.`));
      if (event.code.includes(`${definition.name}(true)`)) steps.push(t('Ici, true signifie « oui / activé ». Le clic active cette valeur.', 'Here, true means “yes / on”. The click turns this value on.', 'هنا تعني true «نعم / مفعّل». تجعل النقرة هذه القيمة مفعّلة.'));
      else if (event.code.includes(`${definition.name}(false)`)) steps.push(t('Ici, false signifie « non / désactivé ». Le clic désactive cette valeur.', 'Here, false means “no / off”. The click turns this value off.', 'هنا تعني false «لا / غير مفعّل». تجعل النقرة هذه القيمة غير مفعّلة.'));
    } else if (definition) {
      steps.push(t(`L’action continue dans la fonction ${definition.name}, à la ligne ${definition.start} de ce même fichier.`, `The action continues in ${definition.name}, a function at line ${definition.start} in this same file.`, `يتابع الإجراء عمله داخل الدالة ${definition.name} في السطر ${definition.start} من الملف نفسه.`));
    }
    if (definitions.some(definition => definition.kind === 'state')) steps.push(t('React recalcule l’affichage avec cette nouvelle valeur. Cherche ses autres utilisations dans le fichier pour voir les parties qui changent.', 'React updates the display using the new value. Find its other uses in this file to see which parts change.', 'يحدّث React العرض باستخدام القيمة الجديدة. ابحث عن استخدامات هذه القيمة في الملف لمعرفة الأجزاء التي تتغير.'));
    if (!definitions.length) {
      steps.push(t('Lis le gestionnaire ci-dessous : ce sont les instructions réelles. Les fonctions importées se trouvent dans les fichiers liés.', 'Read the handler below: these are the real instructions. Imported functions are found in the connected files.', 'اقرأ معالج الحدث أدناه: هذه هي التعليمات الحقيقية. توجد الدوال المستوردة في الملفات المرتبطة.'));
    }
  }
  if (element.attributes.href) steps.push(t(`Le lien mène à « ${element.attributes.href} ». href est l’adresse de destination, comme l’adresse écrite sur une enveloppe.`, `The link leads to “${element.attributes.href}”. href is its destination address, like the address on an envelope.`, `يأخذك الرابط إلى «${element.attributes.href}». href هو عنوان الوجهة، مثل العنوان المكتوب على ظرف رسالة.`));
  if (!event && !element.attributes.href) steps.push(t('Cet extrait décrit l’affichage. Aucun gestionnaire d’action direct n’y est défini : un clic peut appartenir au lien ou au composant parent.', 'This excerpt describes the display. It defines no direct action handler: a click may belong to the surrounding link or component.', 'يصف هذا المقتطف طريقة العرض. لا يعرّف معالج إجراء مباشرًا؛ فقد يكون النقر مرتبطًا بالرابط أو المكوّن الذي يحتويه.'));
  return { steps, event, definition };
}
