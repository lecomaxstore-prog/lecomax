import { learningContext } from '../utils/learning-memory';
import { journeyTutorContext } from '../services/learning-roadmap';
import { auth } from '../services/auth';
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field, Label, Row } from '../components/UI';
import { fonts } from '../constants/design';
import {
  AIEmptyState,
  AIHeader,
  TeacherIcon,
  TeacherSheet,
  TeacherShell,
  ThinkingIndicator,
} from '../components/TeacherUI';
import * as Clipboard from 'expo-clipboard';
import { TeacherLearningTools } from '../components/TeacherLearningTools';
import { TeacherMessage } from '../components/TeacherMessage';
import { TeacherLab, type LabSeed } from '../components/TeacherLab';
import { TeacherWebStudio, type WebSeed } from '../components/TeacherWebStudio';
import { useSchool } from '../store/School';
import { askTeacherReply, logout, token, type TeacherOptions } from '../services/teacher';
import { getLesson } from '../services/content';

export default function MobileTeacher() {
  const {
    file: source,
    lesson: lessonId,
    explain,
    question,
  } = useLocalSearchParams<{
    file?: string;
    lesson?: string;
    explain?: string;
    question?: string;
  }>();
  return (
    <TeacherChat
      key={`${source || ''}:${lessonId || ''}:${explain || ''}:${question || ''}`}
      source={source}
      lessonId={lessonId}
      explain={explain}
      question={question}
    />
  );
}
function TeacherChat({
  source,
  lessonId,
  explain,
  question,
}: {
  source?: string;
  lessonId?: string;
  explain?: string;
  question?: string;
}) {
  const { state, update, t, colors, rtl, ready } = useSchool();
  const startedLesson = useRef(false);
  const [authReady, setAuthReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [fileOverride, setFile] = useState<string | null>(null);
  const [useLesson, setUseLesson] = useState(true);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<'login' | 'message' | null>(null);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const [mode, setMode] = useState('teach');
  const [focused, setFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(48);
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [labSeed, setLabSeed] = useState<LabSeed | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioSeed, setStudioSeed] = useState<WebSeed | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const beginner = state.level === 1;
  const setBeginner = (enabled: boolean) => update((p) => ({ ...p, level: enabled ? 1 : 2 }));
  const [topic, setTopic] = useState('general');
  const scroll = useRef<ScrollView>(null);
  const composer = useRef<TextInput>(null);
  const abort = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const shouldScroll = useRef(false);
  const responsePosition = useRef(0);
  const responseReady = useRef(false);
  const history = state.teacher.history;
  const message = state.teacher.draft;
  const file = fileOverride ?? source ?? '';
  const lesson = useLesson && lessonId ? getLesson(lessonId, state.language) : undefined;
  const level = beginner ? 'beginner' : state.level === 3 ? 'advanced' : 'intermediate';
  const setMessage = (draft: string) =>
    update((p) => ({ ...p, teacher: { ...p.teacher, draft: draft.slice(0, 6000) } }));
  const modes = [
    ['simple', t('Expliquer', 'Explain', 'شرح')],
    ['feature', t('Code', 'Code', 'كود')],
    ['debug', t('Corriger', 'Debug', 'تصحيح')],
    ['teach', t('Apprendre', 'Learn', 'تعلّم')],
    ['project', t('Projet', 'Project', 'مشروع')],
  ];
  const topics = [
    ['nextjs', 'Next.js'],
    ['react', 'React'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['python', 'Python'],
    ['api', 'API'],
    ['database', 'SQL / Supabase'],
    ['deployment', t('Déploiement', 'Deployment', 'النشر')],
    ['general', t('Tous les sujets', 'Any topic', 'أي موضوع')],
  ];
  const levels = [
    t('Débutant', 'Beginner', 'مبتدئ'),
    t('Intermédiaire', 'Intermediate', 'متوسط'),
    t('Avancé', 'Advanced', 'متقدم'),
  ];
  useEffect(() => {
    token()
      .then((v) => setConnected(!!v))
      .catch(() => setConnected(false))
      .finally(() => setAuthReady(true));
    return () => abort.current?.abort();
  }, []);
  const fail = (e: unknown) => {
    const code = e instanceof Error ? e.message : '';
    if (code === 'REQUEST_CANCELLED') {
      setError(
        t(
          'Envoi arrêté. Ton brouillon est conservé.',
          'Request stopped. Your draft is saved.',
          'توقف الطلب. مسودتك محفوظة.',
        ),
      );
      return;
    }
    if (code === 'OWNER_LOGIN_REQUIRED') {
      setConnected(false);
      void auth.validate().catch(() => {});
    }
    setError(
      code === 'OWNER_LOGIN_REQUIRED'
        ? t(
            'Connecte-toi avec le compte propriétaire.',
            'Sign in with the owner account.',
            'سجّل الدخول بحساب المالك.',
          )
        : code === 'RATE_LIMIT'
          ? t(
              'Limite atteinte. Réessaie plus tard.',
              'Rate limit reached. Try again later.',
              'وصلت للحد. حاول لاحقًا.',
            )
          : code === 'SENSITIVE_CONTENT'
            ? t(
                'Retire les clés et mots de passe.',
                'Remove keys and passwords.',
                'احذف المفاتيح وكلمات المرور.',
              )
            : code === 'SOURCE_UNAVAILABLE'
              ? t(
                  'Fichier indisponible. Retire le contexte ou choisis un autre fichier.',
                  'File unavailable. Remove the context or choose another file.',
                  'الملف غير متاح. أزل السياق أو اختر ملفًا آخر.',
                )
              : t(
                  'Le professeur est indisponible. Ton brouillon est conservé : réessaie dans un instant.',
                  'The teacher is unavailable. Your draft is saved: try again shortly.',
                  'الأستاذ غير متاح. مسودتك محفوظة: أعد المحاولة بعد قليل.',
                ),
    );
  };
  const send = async (lessonPrompt?: string) => {
    if (sending.current || !(lessonPrompt ?? message).trim()) return;
    if (!connected) {
      void auth.validate().catch(() => {});
      Keyboard.dismiss();
      return;
    }
    sending.current = true;
    const sent = (lessonPrompt ?? message).trim(),
      originalDraft = message;
    const controller = new AbortController();
    abort.current = controller;
    setBusy('message');
    setError('');
    setPending(sent);
    shouldScroll.current = true;
    Keyboard.dismiss();
    try {
      const options: TeacherOptions = {
        profile: state.academy?.profile.onboarded ? state.academy.profile : undefined,
        ...(lesson || file.trim() ? { learning: learningContext(state) } : {}),
        topic,
        level,
        signal: controller.signal,
        ...(lesson
          ? {
              lesson: {
                title: lesson.title.slice(0, 200),
                concept: [
                  journeyTutorContext(state),
                  lesson.concept,
                  ...lesson.explanation.map((block) =>
                    [block.title, block.text].filter(Boolean).join('\n'),
                  ),
                  ...lesson.summary,
                ]
                  .filter(Boolean)
                  .join('\n\n')
                  .slice(0, 1600),
              },
            }
          : {}),
      };
      const reply = await askTeacherReply(
        sent,
        state.academy?.profile.onboarded
          ? state.academy.profile.teacherLanguage === 'darija'
            ? 'ar'
            : state.academy.profile.teacherLanguage
          : state.language,
        mode,
        file.trim(),
        lessonPrompt ? [] : history,
        options,
      );
      if (controller.signal.aborted) return;
      update((p) => ({
        ...p,
        teacher: {
          ...p.teacher,
          draft: !lessonPrompt && p.teacher.draft === originalDraft ? '' : p.teacher.draft,
          history: [
            ...p.teacher.history,
            { role: 'user' as const, content: sent },
            { role: 'assistant' as const, content: reply.answer },
          ].slice(-40),
        },
      }));
      setModel(reply.model || '');
      setInputHeight(48);
      responseReady.current = true;
    } catch (e) {
      if (lessonPrompt)
        update((p) => ({
          ...p,
          teacher: { ...p.teacher, draft: p.teacher.draft || lessonPrompt },
        }));
      fail(e);
    } finally {
      setBusy(null);
      setPending('');
      abort.current = null;
      sending.current = false;
    }
  };
  const startLesson = useEffectEvent(() => {
    if ((!lesson && !question) || startedLesson.current) return;
    if (!connected) {
      void auth.validate().catch(() => {});
      return;
    }
    startedLesson.current = true;
    if (question) {
      void send(question.slice(0, 6000));
      return;
    }
    if (!lesson) return;
    void send(
      t(
        `Aide-moi à approfondir le cours « ${lesson.title} ». Explique les idées simplement, étape par étape, avec un exemple concret, puis propose un petit exercice et attends ma réponse.`,
        `Teach me more about the lesson “${lesson.title}”. Explain the ideas simply, step by step, with a concrete example, then give me a small exercise and wait for my answer.`,
        `علّمني أكثر عن درس «${lesson.title}». اشرح لي الأفكار ببساطة خطوة بخطوة مع مثال عملي، ثم أعطني تمرينًا صغيرًا وانتظر إجابتي.`,
      ),
    );
  });
  useEffect(() => {
    if (!explain || (!lesson && !question) || !ready || !authReady || startedLesson.current) return;
    // Defer until the screen is mounted; cleanup cancels a superseded lesson launch.
    const timer = setTimeout(() => startLesson(), 0);
    return () => clearTimeout(timer);
  }, [explain, lesson, question, ready, authReady, connected]);
  const choosePrompt = (text: string) => {
    setMessage(text);
    composer.current?.focus();
  };
  const compactButton = { minHeight: 44, paddingVertical: 8, paddingHorizontal: 12 };
  return (
    <TeacherShell>
      <Button
        quiet
        icon="images-outline"
        title={t('Ouvrir mon espace professeur', 'Open my teaching workspace', 'افتح مساحة معلّمي')}
        onPress={() => router.push('/tutor')}
      />
      <AIHeader
        hasConversation={history.length > 0}
        busy={!!busy}
        onNewChat={() => setConfirmClear(true)}
        onSettings={() => setSettings(true)}
      />
      <Row style={{ flexWrap: 'nowrap', gap: 8, paddingBottom: 10 }}>
        {(
          [
            [
              'terminal-outline',
              t('Laboratoire', 'Practice lab', 'المختبر العملي'),
              t('Exécuter du code', 'Run your code', 'جرّب كودك'),
              () => setLabOpen(true),
            ],
            [
              'code-slash-outline',
              t('Studio web', 'Web studio', 'استوديو الويب'),
              t('Créer et prévisualiser', 'Build & preview', 'صمّم وعاين'),
              () => setStudioOpen(true),
            ],
          ] as const
        ).map(([icon, title, subtitle, onPress]) => (
          <Pressable
            key={icon}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 64,
              padding: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: pressed ? colors.soft : colors.card,
            })}
          >
            <Row style={{ flexWrap: 'nowrap', gap: 9 }}>
              <View
                style={{
                  width: 32,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Label bold size={12} numberOfLines={1}>
                  {title}
                </Label>
                <Label muted size={10} numberOfLines={1}>
                  {subtitle}
                </Label>
              </View>
            </Row>
          </Pressable>
        ))}
      </Row>
      <TeacherWebStudio
        key={studioSeed ? studioSeed.language + studioSeed.code : 'studio'}
        visible={studioOpen}
        seed={studioSeed}
        onClose={() => setStudioOpen(false)}
        onExplain={(prompt) => {
          setMode('lines');
          choosePrompt(prompt);
        }}
      />
      <ScrollView
        ref={scroll}
        style={{ flex: 1, minHeight: 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={100}
        onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) =>
          setAwayFromBottom(contentSize.height - contentOffset.y - layoutMeasurement.height > 180)
        }
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, gap: 20, paddingTop: 14, paddingBottom: 24 }}
        onContentSizeChange={() => {
          if (responseReady.current) {
            scroll.current?.scrollTo({ y: responsePosition.current, animated: true });
            responseReady.current = false;
          } else if (shouldScroll.current) {
            scroll.current?.scrollToEnd({ animated: true });
            shouldScroll.current = false;
          }
        }}
      >
        {(!!lesson || !!file) && (
          <View style={{ paddingVertical: 4 }}>
            <Label size={12}>
              {t('En cours', 'Learning now', 'تتعلّم الآن')} ·{' '}
              {lesson?.title || '\u2066' + file + '\u2069'}
            </Label>
          </View>
        )}
        {!history.length && !pending && <AIEmptyState onPrompt={choosePrompt} />}
        {history.map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: item.role === 'user' ? colors.soft : colors.card,
              paddingHorizontal: 16,
              paddingVertical: item.role === 'user' ? 10 : 16,
              borderWidth: item.role === 'user' ? 0 : 1,
              borderColor: colors.line,
              gap: 12,
              borderRadius: 18,
              minWidth: 0,
              maxWidth: item.role === 'user' ? '85%' : '100%',
              alignSelf: item.role === 'user' ? (rtl ? 'flex-start' : 'flex-end') : 'stretch',
            }}
          >
            {item.role === 'assistant' && (
              <Row style={{ gap: 8, marginTop: 4 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 9,
                    backgroundColor: colors.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="sparkles" size={14} color={colors.accent} />
                </View>
                <Label bold size={12} style={{ color: colors.accent }}>
                  {t('Ton professeur', 'Your teacher', 'أستاذك')}
                </Label>
              </Row>
            )}
            {item.role === 'assistant' ? (
              <TeacherMessage
                content={item.content}
                onPreview={(seed) => {
                  setStudioSeed(seed);
                  setStudioOpen(true);
                }}
                onRun={(seed) => {
                  setLabSeed(seed);
                  setLabOpen(true);
                }}
                onExplain={(code) => {
                  setMode('lines');
                  choosePrompt(
                    t(
                      'Explique ce code ligne par ligne :',
                      'Explain this code line by line:',
                      'اشرح هذا الكود سطراً بسطر:',
                    ) +
                      '\n```\n' +
                      code +
                      '\n```',
                  );
                }}
              />
            ) : (
              <Label selectable size={15} style={{ color: colors.text }}>
                {item.content}
              </Label>
            )}
            {item.role === 'assistant' && (
              <Row
                style={{
                  gap: 4,
                  marginTop: 0,
                  borderTopWidth: 1,
                  borderColor: colors.line,
                  paddingTop: 4,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    copied === i ? t('Copié', 'Copied', 'تم النسخ') : t('Copier', 'Copy', 'نسخ')
                  }
                  onPress={() => {
                    void Clipboard.setStringAsync(item.content)
                      .then(() => setCopied(i))
                      .catch(() => setCopied(null));
                  }}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    backgroundColor: pressed ? colors.soft : 'transparent',
                  })}
                >
                  <Ionicons
                    name={copied === i ? 'checkmark-outline' : 'copy-outline'}
                    size={17}
                    color={copied === i ? colors.accent : colors.muted}
                  />
                </Pressable>
              </Row>
            )}
          </View>
        ))}
        {!!pending && (
          <View
            onLayout={(event) => {
              responsePosition.current = event.nativeEvent.layout.y;
            }}
            style={{ gap: 12 }}
          >
            <View
              style={{
                backgroundColor: colors.soft,
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 10,
                maxWidth: '85%',
                alignSelf: rtl ? 'flex-start' : 'flex-end',
              }}
            >
              <Label size={15}>{pending}</Label>
            </View>
            <ThinkingIndicator />
          </View>
        )}
        {!!history.length && !busy && (
          <Row style={{ marginTop: -8, gap: 6 }}>
            {[
              [
                t('Simplifier', 'Simplify', 'بسّط الشرح'),
                t('Explique plus simplement', 'Explain more simply', 'اشرح ببساطة أكثر'),
              ],
              [
                t('Un exemple', 'Example', 'مثال عملي'),
                t(
                  'Donne-moi un exemple concret',
                  'Give me a practical example',
                  'أعطني مثالاً عملياً',
                ),
              ],
              [
                t('La suite', 'Next step', 'الخطوة التالية'),
                t(
                  'Passons à la prochaine étape',
                  'Continue to the next step',
                  'لننتقل للخطوة التالية',
                ),
              ],
            ].map(([label, prompt]) => (
              <Button
                variant="ghost"
                key={prompt}
                title={label!}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
                onPress={() => choosePrompt(prompt!)}
              />
            ))}
          </Row>
        )}
      </ScrollView>
      {awayFromBottom && history.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: inputHeight + 78,
            alignSelf: 'center',
            borderRadius: 24,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.line,
            zIndex: 2,
          }}
        >
          <TeacherIcon
            icon="arrow-down"
            label={t('Dernier message', 'Latest message', 'آخر رسالة')}
            onPress={() => scroll.current?.scrollToEnd({ animated: true })}
          />
        </View>
      )}
      <View
        style={{
          backgroundColor: colors.card,
          borderColor: focused ? colors.accent : colors.line,
          borderWidth: 1,
          borderRadius: 22,
          padding: 8,
          gap: 2,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }}
      >
        {!!error && (
          <Label
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            size={12}
            style={{ color: colors.danger }}
          >
            {error}
          </Label>
        )}
        {!!error && connected && (
          <Button
            variant="ghost"
            title={t('Réessayer', 'Retry', 'أعد المحاولة')}
            disabled={!!busy || !message.trim()}
            onPress={() => void send()}
          />
        )}
        <TextInput
          ref={composer}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onContentSizeChange={(event) =>
            setInputHeight(Math.max(48, Math.min(104, event.nativeEvent.contentSize.height)))
          }
          autoCorrect={mode !== 'lines' && mode !== 'feature'}
          scrollEnabled={inputHeight >= 104}
          accessibilityLabel={t('Message au professeur', 'Message to teacher', 'رسالة إلى الأستاذ')}
          multiline
          maxLength={6000}
          value={message}
          onChangeText={(draft) => {
            setMessage(draft);
            if (!draft) setInputHeight(48);
          }}
          placeholder={t(
            'Pose ta question…',
            'Ask your teacher…',
            'اسأل معلّمك…',
          )}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          selectionHandleColor={colors.accent}
          underlineColorAndroid="transparent"
          style={{
            height: inputHeight,
            minHeight: 48,
            maxHeight: 104,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: 'transparent',
            borderWidth: 0,
            ...(Platform.OS === 'web'
              ? { outlineWidth: 0, outlineColor: 'transparent', caretColor: colors.accent }
              : {}),
            fontFamily: rtl ? fonts.arabic : fonts.body,
            fontSize: 15,
            lineHeight: 25,
            color: colors.text,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
            textAlignVertical: 'top',
          }}
        />
        <Row
          style={{
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            gap: 6,
            paddingTop: 2,
          }}
        >
          <TeacherIcon
            icon={toolsOpen ? 'close-outline' : 'add-outline'}
            label={t('Outils du message', 'Message tools', 'أدوات الرسالة')}
            onPress={() => setToolsOpen(!toolsOpen)}
          />
          <Button
            variant="ghost"
            icon="chevron-down"
            title={
              mode === 'lines'
                ? t('Lire le code', 'Read code', 'شرح الكود')
                : modes.find(([key]) => key === mode)?.[1] || ''
            }
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: colors.neutral,
            }}
            onPress={() => setToolsOpen(true)}
          />
          <View style={{ flex: 1 }} />
          {message.length > 5400 && (
            <Label muted size={11}>
              {message.length}/6000
            </Label>
          )}
          <TeacherIcon
            primary
            disabled={busy !== 'message' && (!!busy || !message.trim())}
            icon={busy === 'message' ? 'stop' : 'arrow-up'}
            label={
              busy === 'message' ? t('Arrêter', 'Stop', 'إيقاف') : t('Envoyer', 'Send', 'أرسل')
            }
            onPress={busy === 'message' ? () => abort.current?.abort() : () => void send()}
          />
        </Row>
      </View>
      <TeacherLab
        key={labSeed ? labSeed.runtime + labSeed.code : 'default-lab'}
        visible={labOpen}
        seed={labSeed}
        onClose={() => setLabOpen(false)}
        onExplain={(prompt) => {
          setMode('lines');
          choosePrompt(prompt);
        }}
      />
      <TeacherSheet
        visible={toolsOpen}
        title={t('Comment apprendre ?', 'How would you like to learn?', 'كيف تريد أن تتعلّم؟')}
        onClose={() => setToolsOpen(false)}
      >
        <TeacherLearningTools
          modes={modes}
          mode={mode}
          disabled={!!busy}
          beginner={beginner}
          onBeginner={setBeginner}
          onMode={(next) => {
            setMode(next);
            setToolsOpen(false);
          }}
          onInsert={() => {
            setMode('lines');
            setToolsOpen(false);
            choosePrompt(message + (message ? '\n' : '') + '```\n\n```');
          }}
        />
      </TeacherSheet>
      <TeacherSheet
        visible={settings}
        title={t('Ton apprentissage', 'Your learning', 'تعلّم بطريقتك')}
        onClose={() => setSettings(false)}
      >
        <Label muted size={12}>
          {t('Sujet', 'Topic', 'الموضوع')}
        </Label>
        <Row>
          {topics.map(([key, label]) => (
            <Button
              key={key}
              quiet
              selected={topic === key}
              disabled={!!busy}
              title={label!}
              style={compactButton}
              onPress={() => setTopic(key!)}
            />
          ))}
        </Row>
        <Label muted size={12}>
          {t('Niveau', 'Level', 'المستوى')}
        </Label>
        <Row>
          {levels.map((label, i) => (
            <Button
              key={label}
              quiet
              selected={state.level === i + 1}
              disabled={!!busy}
              title={label}
              style={compactButton}
              onPress={() => {
                update((p) => ({ ...p, level: i + 1 }));
              }}
            />
          ))}
        </Row>
        <Field
          value={file}
          onChangeText={setFile}
          placeholder={t(
            'Fichier du projet (facultatif)',
            'Project file (optional)',
            'ملف المشروع (اختياري)',
          )}
          editable={!busy}
        />
        {(!!file || !!lesson) && (
          <Button
            quiet
            title={t('Retirer le contexte', 'Remove context', 'إزالة السياق')}
            disabled={!!busy}
            onPress={() => {
              setFile('');
              setUseLesson(false);
            }}
          />
        )}
        {!!model && (
          <Label muted size={12}>
            OpenAI · {model}
          </Label>
        )}
        <Label muted size={12}>
          {t(
            'Les derniers échanges sont utilisés pour poursuivre le cours. Conversation et brouillon conservés sur cet appareil.',
            'Recent messages are used to continue the lesson. Conversation and draft are saved on this device.',
            'تُستخدم الرسائل الأخيرة لمتابعة الدرس. تُحفظ المحادثة والمسودة على هذا الجهاز.',
          )}
        </Label>
        {connected && (
          <Button
            quiet
            disabled={!!busy}
            title={t('Déconnexion', 'Sign out', 'تسجيل الخروج')}
            onPress={() =>
              logout()
                .then(() => {
                  setConnected(false);
                  setModel('');
                })
                .catch(fail)
            }
          />
        )}
      </TeacherSheet>
      <TeacherSheet
        visible={confirmClear}
        title={t('Nouvelle discussion', 'New chat', 'محادثة جديدة')}
        onClose={() => setConfirmClear(false)}
      >
        <Label>
          {t(
            'Effacer cette conversation et le brouillon ?',
            'Clear this conversation and draft?',
            'هل تريد مسح المحادثة والمسودة؟',
          )}
        </Label>
        <Button
          title={t('Confirmer', 'Confirm', 'تأكيد')}
          disabled={!!busy}
          onPress={() => {
            update((p) => ({ ...p, teacher: { draft: '', history: [] } }));
            setConfirmClear(false);
            setError('');
            setModel('');
          }}
        />
        <Button
          variant="ghost"
          title={t('Annuler', 'Cancel', 'إلغاء')}
          onPress={() => setConfirmClear(false)}
        />
      </TeacherSheet>
    </TeacherShell>
  );
}
