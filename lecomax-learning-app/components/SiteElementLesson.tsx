import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Row } from './UI';
import { CodeViewer } from './CodeViewer';
import { useSchool } from '../store/School';
import { getSource, project, resolveImport } from '../services/content';
import { elementLesson, type SourceSelection } from '../utils/site-learning';
import { describeSourceBehavior, matchSourceElement, sourceExcerpt, type SourceIndex } from '../utils/source-lesson';
import snapshot from '../data/site-source-map.json';

const sources: Record<string, SourceIndex> = snapshot.files;
export function SiteElementLesson({ selection, page, onClose, onOpen }: { selection: SourceSelection; page: string; onClose: () => void; onOpen: (href: string) => void }) {
  const { state, update, colors, t, rtl } = useSchool();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const file = project.find(file => file.path === selection.path);
  const content = getSource(selection.path)?.content;
  const indexed = sources[selection.path];
  const match = indexed && file?.hash === indexed.hash ? matchSourceElement(selection, indexed) : undefined;
  const guide = elementLesson(selection, state.language);
  const behavior = match && indexed ? describeSourceBehavior(match.element, indexed, state.language) : undefined;
  const excerpt = content ? sourceExcerpt(content, match?.element.start || 1, match?.element.end || 10) : undefined;
  const handler = content && behavior?.event ? sourceExcerpt(content, behavior.event.start, behavior.event.end, 14) : undefined;
  const definition = content && behavior?.definition ? sourceExcerpt(content, behavior.definition.start, behavior.definition.end, 12) : undefined;
  const connected = [...new Set(file?.imports.map(imp => resolveImport(selection.path, imp)).filter((path): path is string => !!path) || [])];
  const key = `site:${selection.path}:${match?.element.start || selection.line || selection.label || 'overview'}`;
  const selectedText = selection.label?.trim() || '';
  const selectionRtl = /^[^A-Za-z\u0600-\u06ff]*[\u0600-\u06ff]/.test(selectedText);
  const readable = (text: string) => rtl ? text.replace(/<\/?[A-Za-z][^>]*>|[A-Za-z][A-Za-z0-9]*/g, '\u2066$&\u2069') : text;
  const titles = [t('Comprendre', 'Understand', 'افهم'), t('Le vrai code', 'Real code', 'الكود الحقيقي'), t('Le fonctionnement', 'How it works', 'كيف يعمل'), t('À toi', 'Your turn', 'جرّب')];
  const go = (next: number) => { setStep(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const openFile = (path: string, line?: number) => { onClose(); router.push({ pathname: '/file', params: { path, ...(line ? { line: String(line) } : {}) } }); };
  const ask = (requestId: string) => {
    const prompt = t(
      `Explique cet élément de mon vrai site à un débutant : « ${selection.label} », page ${page}. Commence par son rôle visible, puis explique ces lignes enregistrées avec une analogie simple. Une idée à la fois, un petit exercice puis attends ma réponse.`,
      `Explain this element of my real site to a beginner: “${selection.label}”, page ${page}. Start with its visible purpose, then explain these saved lines with one simple analogy. One idea at a time, one small exercise, then wait for my answer.`,
      `اشرح هذا العنصر من موقعي الحقيقي لمبتدئ: «${selection.label}»، الصفحة ${page}. ابدأ بدوره الذي أراه ثم اشرح الأسطر المحفوظة بمثال بسيط من الحياة. فكرة واحدة في كل مرة، ثم تمرين صغير وانتظر إجابتي.`,
    );
    const evidence = excerpt && content ? [excerpt, handler, definition].filter((value): value is NonNullable<typeof excerpt> => !!value).map(value => `${selection.path}:${value.start}-${value.end}\n${value.code}`).join('\n\n').slice(0, 4000) : '';
    const question = `${prompt}\n\nSaved source snapshot: ${snapshot.capturedAt}. SHA256: ${file?.hash || 'unavailable'}.\n${match?.confidence === 'matched' ? 'Matched element by label or destination in saved source.' : match ? 'Candidate based only on a captured line number; the deployed source can differ. Explain the supplied code without claiming an exact element match.' : 'Only a file overview is available. Do not invent the selected element’s implementation.'}\n${evidence}\nUse this quoted snapshot for the explanation. If other supplied sources differ, say so.`.slice(0, 6000);
    onClose(); router.push({ pathname: '/(tabs)/teacher', params: { ...(file ? { file: file.path } : {}), question, explain: requestId } });
  };
  return <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.bg }}>
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ gap: 3, flex: 1 }}>
          <Label bold size={17}>{t('Ta mini-leçon', 'Your mini lesson', 'درسك المصغّر')}</Label>
          <Label muted size={11}>{t(`Étape ${step + 1} sur 4`, `Step ${step + 1} of 4`, `الخطوة ${step + 1} من 4`)}</Label>
        </View>
        <Button variant="ghost" style={{ minHeight: 44, paddingHorizontal: 12 }} title={t('Fermer', 'Close', 'إغلاق')} onPress={onClose} />
      </Row>
      <Row style={{ flexWrap: 'nowrap', gap: 6 }}>
        {titles.map((title, i) => <Button key={title} quiet selected={step === i} title={title} style={{ flex: 1, paddingHorizontal: 3, minHeight: 64, borderRadius: 12, justifyContent: 'center' }} onPress={() => go(i)} />)}
      </Row>
    </View>
    <ScrollView ref={scroll} style={{ flex: 1, minHeight: 0 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 12 }}>
        <Label bold size={21} accessibilityRole="header" style={{ lineHeight: rtl ? 34 : 29 }}>{guide.title}</Label>
        {!!selectedText && <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, gap: 8 }}>
          <Label muted bold size={11}>{t('Élément sélectionné', 'Selected element', 'العنصر اللي اخترتي')}</Label>
          <Label selectable size={14} numberOfLines={showSelection ? undefined : 3} style={{ lineHeight: 23, writingDirection: selectionRtl ? 'rtl' : 'ltr', textAlign: selectionRtl ? 'right' : 'left' }}>{selectedText}</Label>
          {selectedText.length > 80 && <Button variant="ghost" style={{ alignSelf: rtl ? 'flex-end' : 'flex-start', minHeight: 44, paddingHorizontal: 0 }} title={showSelection ? t('Réduire', 'Show less', 'عرض أقل') : t('Voir le texte complet', 'Show full text', 'عرض النص كامل')} onPress={() => setShowSelection(value => !value)} />}
        </View>}
      </View>
      {match?.confidence === 'line' && <Label muted size={11} style={{ lineHeight: 20, paddingHorizontal: 4 }}>{t('Extrait repéré par le numéro de ligne de la capture. La version locale peut différer.', 'Excerpt located using the capture’s line number. The local version may differ.', 'حُدّد المقتطف برقم السطر في النسخة المصوّرة. قد تختلف النسخة المحلية.')}</Label>}
      {step === 0 && <>
        <Card style={{ padding: 18, gap: 10, borderRadius: 16, shadowOpacity: 0, elevation: 0 }}>
          <Label bold size={15}>{t('Ce que tu vois', 'What you see', 'ما الذي تراه؟')}</Label>
          <Label size={14} style={{ lineHeight: rtl ? 27 : 24 }}>{readable(guide.what)}</Label>
        </Card>
        <Card style={{ padding: 18, gap: 16, borderRadius: 16, shadowOpacity: 0, elevation: 0 }}><Label bold size={15}>{t('Ce que fait ton code', 'What your code does', 'ماذا يفعل كودك؟')}</Label>
          {behavior ? behavior.steps.map((text, i) => <Row key={i} style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 10, paddingTop: i ? 14 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Label bold size={11} style={{ color: colors.accent }}>{i + 1}</Label>
            </View>
            <Label size={14} style={{ flex: 1, minWidth: 0, lineHeight: rtl ? 27 : 24 }}>{rtl ? text.replace(/[A-Za-z][A-Za-z0-9]*/g, '\u2066$&\u2069') : text}</Label>
          </Row>) : <Label>{t('Le fichier de cette zone est retrouvé. Pour cet élément, la correspondance exacte n’est pas certaine : nous allons lire le fichier sans inventer son comportement.', 'The file for this area is available. The exact element match is uncertain, so we’ll read the file without inventing its behavior.', 'وجدنا ملف هذه المنطقة. لكن مطابقة العنصر بدقة غير مؤكدة؛ سنقرأ الملف دون افتراض طريقة عمله.')}</Label>}
        </Card>
        {!!selection.href && <Label>{t('Destination du lien', 'Link destination', 'وجهة الرابط')}: {selection.href}</Label>}
        {!!selection.href && <Button quiet title={t('Ouvrir la page du lien', 'Open the linked page', 'افتح صفحة الرابط')} onPress={() => onOpen(selection.href!)} />}
      </>}
      {step === 1 && <>
        <Card>
          <Label bold>{t('Enregistré dans ton application', 'Saved inside your app', 'محفوظ داخل تطبيقك')}</Label>
          <Label selectable style={{ writingDirection: 'ltr', textAlign: 'left' }} size={13}>{selection.path}</Label>
          <Label muted size={12}>{t('Lis ces lignes, puis touche une ligne pour comprendre sa syntaxe.', 'Read these lines, then tap a line to understand its syntax.', 'اقرأ هذه الأسطر ثم المس أي سطر لفهم طريقة كتابته.')}</Label>
          <Label muted size={12}>{t('Version des fichiers', 'Source version', 'نسخة الملفات')}: {new Date(snapshot.capturedAt).toLocaleDateString(state.language)} · {file?.hash.slice(0, 10)}</Label>
          <Label muted size={12}>{match ? t('Correspondance dans les fichiers locaux ; le site publié peut avoir une autre version.', 'Match in local files; the published site may use another version.', 'مطابقة داخل الملفات المحلية؛ قد يستخدم الموقع المنشور نسخة أخرى.') : t('Vue du fichier, pas une correspondance exacte de l’élément.', 'File overview, not an exact element match.', 'نظرة على الملف، وليست مطابقة دقيقة للعنصر.')}</Label>
        </Card>
        {excerpt ? <CodeViewer code={excerpt.code} filename={selection.path} start={excerpt.start} /> : <Label>{t('Ce fichier n’est pas disponible dans cette version.', 'This file is unavailable in this version.', 'هذا الملف غير متاح في هذه النسخة.')}</Label>}
        {!!excerpt?.truncated && <Label muted>{t('Extrait court ; ouvre le fichier pour lire la suite.', 'Short excerpt; open the file to read the rest.', 'مقتطف قصير؛ افتح الملف لقراءة الباقي.')}</Label>}
        {!!file && <Button quiet title={t('Ouvrir le fichier complet', 'Open the full file', 'افتح الملف كاملًا')} onPress={() => openFile(file.path, excerpt?.start)} />}
      </>}
      {step === 2 && <>
        <Label bold>{t('Du geste au résultat', 'From action to result', 'من الإجراء إلى النتيجة')}</Label>
        {behavior?.steps.map((text, i) => <Card key={i}><Label bold>{i + 1}.</Label><Label>{text}</Label></Card>)}
        {!!handler && <><Label bold>{t('Les instructions de cette action', 'The instructions for this action', 'تعليمات هذا الإجراء')}</Label><CodeViewer code={handler.code} start={handler.start} filename={selection.path} /></>}
        {!!definition && <><Label bold>{t('La valeur ou la fonction utilisée', 'The value or function it uses', 'القيمة أو الدالة المستخدمة')}</Label><CodeViewer code={definition.code} start={definition.start} filename={selection.path} /></>}
        <Card><Label bold>{t('Fichiers reliés', 'Connected files', 'الملفات المرتبطة')}</Label>
          <Label muted>{t('Ce fichier importe les fichiers suivants. Une importation ne signifie pas que chaque clic les utilise tous.', 'This file imports the files below. An import does not mean every click uses all of them.', 'يستورد هذا الملف الملفات التالية. وجود الاستيراد لا يعني أن كل نقرة تستخدمها كلها.')}</Label>
          {connected.map(path => <Button quiet key={path} title={path} onPress={() => openFile(path)} />)}
          {!connected.length && <Label>{t('Aucun fichier local importé trouvé.', 'No imported local files found.', 'لم نعثر على ملفات محلية مستوردة.')}</Label>}
        </Card>
      </>}
      {step === 3 && <>
        <Card><Label bold>{t('Explique avec tes mots', 'Explain it in your own words', 'اشرح بكلماتك')}</Label>
          <Label>{behavior?.event ? t(`Que se passerait-il si tu retirais ${behavior.event.name} de cet élément ?`, `What would happen if you removed ${behavior.event.name} from this element?`, `ماذا سيحدث إذا حذفت ${behavior.event.name} من هذا العنصر؟`) : guide.challenge}</Label>
          <Field multiline value={state.notes[key] || ''} onChangeText={text => update(previous => ({ ...previous, notes: { ...previous.notes, [key]: text } }))} placeholder={t('Ma réponse…', 'My answer…', 'إجابتي…')} />
          <Label muted size={12}>{t('Ta réponse est conservée sur cet appareil.', 'Your answer is saved on this device.', 'تُحفظ إجابتك على هذا الجهاز.')}</Label>
          <Button quiet title={t('Voir l’explication', 'Show the explanation', 'اعرض الشرح')} onPress={() => setAnswer(true)} />
          {answer && <Label>{behavior?.event ? t('Les instructions de ce gestionnaire ne seraient plus déclenchées par cette action. Un lien ou un formulaire peut conserver son comportement normal : vérifie aussi href et le composant parent.', 'That action would no longer trigger this handler’s instructions. A link or form may still have its normal behavior: also check href and the surrounding component.', 'لن يشغّل هذا الإجراء تعليمات المعالج بعد حذفه. قد يحتفظ الرابط أو النموذج بسلوكه الأساسي؛ راجع أيضًا href والمكوّن المحيط.') : guide.answer}</Label>}
        </Card>
        <Button title={t('Continuer avec le prof IA', 'Continue with the AI teacher', 'تابع مع المعلّم الذكي')} onPress={() => ask(String(Date.now()))} />
      </>}
    </ScrollView>
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card }}>
      <Row style={{ flexWrap: 'nowrap', gap: 10 }}>
        <Button quiet style={{ minHeight: 48, borderRadius: 12 }} disabled={step === 0} title={t('Précédent', 'Previous', 'السابق')} onPress={() => go(step - 1)} />
        <Button style={{ flex: 1, minHeight: 48, borderRadius: 12 }} icon={step < 3 ? (rtl ? 'arrow-back' : 'arrow-forward') : 'checkmark-outline'} title={step < 3 ? titles[step + 1]! : t('Revenir au site', 'Back to site', 'العودة إلى الموقع')} onPress={() => step < 3 ? go(step + 1) : onClose()} />
      </Row>
    </View>
  </View>;
}
