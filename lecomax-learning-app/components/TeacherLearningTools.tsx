import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchool } from '../store/School';
import { Label, Row } from './UI';

export function TeacherLearningTools({
  modes,
  mode,
  disabled,
  beginner,
  onBeginner,
  onMode,
  onInsert,
}: {
  modes: string[][];
  mode: string;
  disabled: boolean;
  beginner: boolean;
  onBeginner: (value: boolean) => void;
  onMode: (mode: string) => void;
  onInsert: () => void;
}) {
  const { colors, t, rtl } = useSchool();
  const details: Record<
    string,
    { icon: React.ComponentProps<typeof Ionicons>['name']; description: string }
  > = {
    simple: {
      icon: 'bulb-outline',
      description: t(
        'Comprendre une idée simplement',
        'Make a concept easy to understand',
        'افهم فكرة بطريقة بسيطة',
      ),
    },
    feature: {
      icon: 'code-slash-outline',
      description: t(
        'Créer un exemple à adapter',
        'Create an example you can adapt',
        'أنشئ مثالاً يمكنك تطبيقه',
      ),
    },
    debug: {
      icon: 'bug-outline',
      description: t(
        'Trouver et corriger une erreur',
        'Find an error and work through the fix',
        'اكتشف الخطأ وتعلّم إصلاحه',
      ),
    },
    teach: {
      icon: 'school-outline',
      description: t(
        'Une explication, puis un petit exercice',
        'A small lesson, then a little practice',
        'شرح قصير، ثم تمرين صغير',
      ),
    },
    project: {
      icon: 'layers-outline',
      description: t(
        'Avancer sur ton propre projet',
        'Take the next step in your project',
        'أنجز الخطوة التالية في مشروعك',
      ),
    },
  };
  return (
    <View style={{ gap: 16 }}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('Mode du professeur', 'Teacher mode', 'طريقة التعلّم')}
        style={{ gap: 4 }}
      >
        {modes.map(([key, label]) => {
          const selected = mode === key;
          const detail = details[key!];
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityHint={detail?.description}
              accessibilityState={{ checked: selected, disabled }}
              aria-checked={selected}
              aria-disabled={disabled}
              disabled={disabled}
              onPress={() => onMode(key!)}
              style={({ pressed }) => ({
                minHeight: 64,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: rtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: selected || pressed ? colors.soft : 'transparent',
                opacity: disabled ? 0.45 : 1,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.card : colors.neutral,
                }}
              >
                <Ionicons
                  name={detail?.icon || 'sparkles-outline'}
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <Label bold={selected} size={15} style={{ lineHeight: 24 }}>
                  {label}
                </Label>
                <Label muted size={12} style={{ lineHeight: 20 }}>
                  {detail?.description}
                </Label>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={21}
                color={selected ? colors.accent : colors.line}
              />
            </Pressable>
          );
        })}
      </View>
      <Row
        style={{
          flexWrap: 'nowrap',
          paddingTop: 16,
          borderTopWidth: 1,
          borderColor: colors.line,
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Label size={14} bold>
            {t('Explications pour débutant', 'Beginner explanations', 'شرح للمبتدئ')}
          </Label>
          <Label muted size={12}>
            {t(
              'Des mots simples, des exemples concrets.',
              'Simple words and practical examples.',
              'كلمات بسيطة وأمثلة من الواقع.',
            )}
          </Label>
        </View>
        <Switch
          accessibilityLabel={t(
            'Explications pour débutant',
            'Beginner explanations',
            'شرح للمبتدئ',
          )}
          value={beginner}
          onValueChange={onBeginner}
          disabled={disabled}
          thumbColor="#FFFFFF"
          trackColor={{ true: colors.primary, false: colors.line }}
          ios_backgroundColor={colors.line}
        />
      </Row>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Insérer du code', 'Insert code', 'إدراج كود')}
        disabled={disabled}
        accessibilityState={{ disabled }}
        onPress={onInsert}
        style={({ pressed }) => ({
          minHeight: 48,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: pressed ? colors.soft : colors.neutral,
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 10,
          opacity: disabled ? 0.45 : 1,
        })}
      >
        <Ionicons name="code-working-outline" size={21} color={colors.accent} />
        <Label size={14} style={{ flex: 1 }}>
          {t('Insérer du code', 'Insert code', 'إدراج كود')}
        </Label>
        <Ionicons name="add-outline" size={20} color={colors.accent} />
      </Pressable>
    </View>
  );
}
