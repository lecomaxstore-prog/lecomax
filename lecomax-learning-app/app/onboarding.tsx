import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { freshAcademy, readProfile, type LearnerProfile } from '../utils/academy';
import { subjects } from '../services/discovery';

export default function Onboarding() {
  const { state, update, t } = useSchool();
  const [profile, setProfile] = useState<LearnerProfile>({
    ...(state.academy || freshAcademy()).profile,
  });
  const [step, setStep] = useState(0);
  const [minutes, setMinutes] = useState(String(profile.dailyMinutes));
  const [error, setError] = useState('');
  const patch = (value: Partial<LearnerProfile>) => setProfile((p) => ({ ...p, ...value }));
  const labels = [
    t('Votre objectif', 'Your learning goal', 'هدفك التعليمي'),
    t('Votre point de départ', 'Your starting point', 'نقطة البداية'),
    t('Votre rythme', 'Your learning rhythm', 'إيقاع تعلّمك'),
  ];
  const save = () => {
    try {
      const checked = readProfile({
        ...profile,
        name: profile.name.trim(),
        goal: profile.goal.trim(),
        dailyMinutes: Number(minutes),
        onboarded: true,
      });
      update((p) => ({
        ...p,
        language: checked.teacherLanguage === 'darija' ? 'ar' : checked.teacherLanguage,
        level: checked.level === 'advanced' ? 3 : checked.level === 'intermediate' ? 2 : 1,
        academy: { ...p.academy, profile: checked },
      }));
      router.replace('/roadmap');
    } catch {
      setError(
        t(
          'Indiquez un objectif et 5 à 240 minutes par jour.',
          'Enter a learning goal and 5–240 minutes per day.',
          'أدخل هدفًا ووقتًا بين 5 و240 دقيقة يوميًا.',
        ),
      );
    }
  };
  return (
    <Page
      title={t('Un parcours à votre mesure', 'A journey that fits you', 'رحلة تعلّم تناسبك')}
      subtitle={t(
        'Modifiable à tout moment dans votre profil.',
        'You can edit these preferences anytime in your profile.',
        'يمكنك تعديل هذه الاختيارات من ملفك في أي وقت.',
      )}
    >
      <ProgressBar value={(step + 1) / 3} />
      <Label muted>
        {step + 1} / 3 · {labels[step]}
      </Label>
      <Card>
        {step === 0 && (
          <>
            <Label bold>
              {t('Comment vous appeler ?', 'What should we call you?', 'ما الاسم الذي تفضّله؟')}
            </Label>
            <Field
              value={profile.name}
              onChangeText={(name) => patch({ name })}
              maxLength={80}
              placeholder={t('Prénom (facultatif)', 'Name (optional)', 'الاسم (اختياري)')}
            />
            <Label bold>
              {t(
                'Que voulez-vous apprendre ?',
                'What would you like to learn?',
                'ماذا تريد أن تتعلّم؟',
              )}
            </Label>
            <Field
              value={profile.goal}
              onChangeText={(goal) => patch({ goal })}
              multiline
              maxLength={500}
              placeholder={t(
                'Parler français, apprendre Python, comprendre les maths…',
                'Speak French, learn Python, understand mathematics…',
                'التحدث بالفرنسية، تعلّم بايثون، فهم الرياضيات…',
              )}
            />
            <Label bold>
              {t('Pourquoi cet objectif ?', 'Why does this goal matter?', 'لماذا تتعلّم؟')}
            </Label>
            <Field
              value={profile.motivation}
              onChangeText={(motivation) => patch({ motivation })}
              maxLength={300}
              placeholder={t(
                'Travail, examen, curiosité… (facultatif)',
                'Work, exams, curiosity… (optional)',
                'العمل، الامتحان، الفضول… (اختياري)',
              )}
            />
          </>
        )}
        {step === 1 && (
          <>
            <Label bold>{t('Votre niveau actuel', 'Your current level', 'مستواك الحالي')}</Label>
            <Label muted>
              {t(
                'Une préférence de départ, pas une preuve de maîtrise. Les révisions utilisent vos réponses réelles.',
                'A starting preference, not proof of mastery. Reviews use your actual answers.',
                'تفضيل للبداية وليس دليل إتقان. تعتمد المراجعات على إجاباتك الفعلية.',
              )}
            </Label>
            <Row>
              {(['zero', 'beginner', 'intermediate', 'advanced'] as const).map((level, i) => (
                <Button
                  key={level}
                  quiet
                  selected={profile.level === level}
                  onPress={() => patch({ level })}
                  title={
                    [
                      t('De zéro', 'Complete beginner', 'من الصفر'),
                      t('Débutant', 'Beginner', 'مبتدئ'),
                      t('Intermédiaire', 'Intermediate', 'متوسط'),
                      t('Avancé', 'Advanced', 'متقدم'),
                    ][i]!
                  }
                />
              ))}
            </Row>
            <Label bold>{t('Langue du professeur', 'Teacher language', 'لغة المعلّم')}</Label>
            <Row>
              {(['ar', 'darija', 'en', 'fr'] as const).map((teacherLanguage) => (
                <Button
                  key={teacherLanguage}
                  quiet
                  selected={profile.teacherLanguage === teacherLanguage}
                  onPress={() => patch({ teacherLanguage })}
                  title={
                    { ar: 'العربية', darija: 'الدارجة المغربية', en: 'English', fr: 'Français' }[
                      teacherLanguage
                    ]
                  }
                />
              ))}
            </Row>
            <Label bold>
              {t('Votre façon d’apprendre', 'How you like to learn', 'كيف تفضّل التعلّم؟')}
            </Label>
            <Row>
              {(['reading', 'examples', 'practice', 'audio', 'mixed'] as const).map((format, i) => (
                <Button
                  key={format}
                  quiet
                  selected={profile.format === format}
                  onPress={() => patch({ format })}
                  title={
                    [
                      t('Lecture', 'Reading', 'القراءة'),
                      t('Exemples', 'Examples', 'الأمثلة'),
                      t('Pratique', 'Practice', 'التطبيق'),
                      t('Oral', 'Spoken style', 'أسلوب شفهي'),
                      t('Mixte', 'Mixed', 'متنوع'),
                    ][i]!
                  }
                />
              ))}
            </Row>
            {profile.format === 'audio' && (
              <Label muted>
                {t(
                  'Le professeur utilise des explications à lire à voix haute. Pas de lecture audio automatique.',
                  'The teacher uses explanations suited to reading aloud. Automatic audio playback is not included.',
                  'سيستخدم المعلّم شرحًا مناسبًا للقراءة بصوت عالٍ. التشغيل الصوتي التلقائي غير متاح.',
                )}
              </Label>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <Label bold>{t('Vos centres d’intérêt', 'Your interests', 'اهتماماتك')}</Label>
            <Row>
              {subjects.map((subject) => (
                <Button
                  key={subject.id}
                  quiet
                  selected={profile.interests?.includes(subject.id)}
                  title={t(subject.title[0], subject.title[1], subject.title[2])}
                  onPress={() =>
                    patch({
                      interests: profile.interests?.includes(subject.id)
                        ? profile.interests.filter((id) => id !== subject.id)
                        : [...(profile.interests || []), subject.id],
                    })
                  }
                />
              ))}
            </Row>
            <Label bold>
              {t('Une routine qui vous convient', 'A routine that fits you', 'روتين يناسبك')}
            </Label>
            <Field
              accessibilityLabel="Routine goal"
              placeholder={t(
                'Routine souhaitée (facultatif)',
                'Routine goal (optional)',
                'هدف الروتين (اختياري)',
              )}
              value={profile.routineGoal || ''}
              maxLength={300}
              onChangeText={(routineGoal) => patch({ routineGoal })}
            />
            <Label bold>
              {t('Vos besoins d’accessibilité', 'Accessibility needs', 'احتياجات الوصول')}
            </Label>
            <Field
              accessibilityLabel="Accessibility needs"
              placeholder={t(
                'Besoins de lecture ou de rythme (facultatif)',
                'Reading or pacing needs (optional)',
                'احتياجات القراءة أو الوتيرة (اختياري)',
              )}
              value={profile.accessibilityNeeds || ''}
              maxLength={300}
              onChangeText={(accessibilityNeeds) => patch({ accessibilityNeeds })}
            />
            <Label muted>
              {t(
                'Ces préférences facultatives restent locales sauf si vous activez le partage ci-dessous. Le texte suit la taille système.',
                'These optional preferences stay local unless you enable sharing below. Text follows system font sizing.',
                'تبقى هذه التفضيلات الاختيارية محلية ما لم تفعّل مشاركتها أدناه. يتبع النص حجم خط النظام.',
              )}
            </Label>
            <Button
              quiet
              selected={!!profile.shareOptionalPreferences}
              title={t(
                'Partager ces préférences facultatives avec le professeur IA',
                'Share optional preferences with the AI tutor',
                'شارك التفضيلات الاختيارية مع المعلّم الذكي',
              )}
              onPress={() => patch({ shareOptionalPreferences: !profile.shareOptionalPreferences })}
            />
            <Label bold>
              {t('Votre objectif quotidien', 'Your daily study target', 'هدفك اليومي')}
            </Label>
            <Row>
              {[10, 20, 30, 45, 60].map((n) => (
                <Button
                  key={n}
                  quiet
                  selected={minutes === String(n)}
                  title={`${n} ${t('min', 'min', 'دقيقة')}`}
                  onPress={() => setMinutes(String(n))}
                />
              ))}
            </Row>
            <Field
              value={minutes}
              onChangeText={setMinutes}
              maxLength={3}
              keyboardType="number-pad"
              placeholder={t(
                'Minutes personnalisées (5–240)',
                'Custom minutes (5–240)',
                'وقت مخصص (5–240 دقيقة)',
              )}
            />
            <Row>
              {(['structured', 'explore'] as const).map((approach) => (
                <Button
                  key={approach}
                  quiet
                  selected={profile.approach === approach}
                  title={
                    approach === 'structured'
                      ? t('Parcours structuré', 'Structured course', 'مسار منظم')
                      : t('Exploration libre', 'Free exploration', 'استكشاف حر')
                  }
                  onPress={() => patch({ approach })}
                />
              ))}
            </Row>
            <Label>{profile.goal}</Label>
            <Label muted>
              {t(
                'Vos préférences guideront les cours générés et les réponses du professeur.',
                'These preferences guide generated courses and the teacher’s responses.',
                'ستوجّه هذه الاختيارات الدورات المولّدة وإجابات المعلّم.',
              )}
            </Label>
          </>
        )}
        {!!error && <Label accessibilityRole="alert">{error}</Label>}
        <Row>
          <Button
            quiet
            title={t('Passer cette question', 'Skip this question', 'تخطّ هذا السؤال')}
            onPress={() => {
              if (step === 0 && !profile.goal.trim())
                patch({
                  goal: t(
                    'Explorer mes centres d’intérêt',
                    'Explore my interests',
                    'استكشف اهتماماتي',
                  ),
                });
              if (step < 2) setStep(step + 1);
              else save();
            }}
          />
          {step > 0 && (
            <Button quiet title={t('Retour', 'Back', 'رجوع')} onPress={() => setStep(step - 1)} />
          )}
          <Button
            disabled={step === 0 && !profile.goal.trim()}
            title={
              step < 2
                ? t('Continuer', 'Continue', 'متابعة')
                : t('Enregistrer mon profil', 'Save my profile', 'احفظ ملفي')
            }
            onPress={() => (step < 2 ? setStep(step + 1) : save())}
          />
        </Row>
      </Card>
    </Page>
  );
}
