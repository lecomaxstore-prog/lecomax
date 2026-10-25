import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Label } from '../components/UI';
import { useSchool } from '../store/School';
import { dark, fonts } from '../constants/design';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, rtl, state, update, colors, ready, error, retry } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 980 && fontScale < 1.5;
  const compact = width < 380;
  const isDark = colors.bg === dark.bg;
  const row = rtl ? 'row-reverse' : 'row';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {Platform.OS === 'web' &&
        React.createElement(
          'style',
          null,
          '#lecomax-auth input { outline: none; box-shadow: none; } #lecomax-auth [role="button"]:focus-visible { outline: 2px solid #176B5B; outline-offset: 4px; }',
        )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            nativeID="lecomax-auth"
            style={{
              width: '100%',
              maxWidth: 1280,
              alignSelf: 'center',
              flex: 1,
              paddingHorizontal: wide ? 56 : compact ? 20 : 28,
              paddingTop: wide ? 32 : 20,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: row,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#173F35',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="book-outline" color="#DEEEB7" size={23} />
                </View>
                <View style={{ gap: 2 }}>
                  <Label bold size={14} style={{ writingDirection: 'ltr', letterSpacing: 0.3 }}>
                    L’ECOMAX
                  </Label>
                  <Label size={9} muted style={{ writingDirection: 'ltr', letterSpacing: 3.4 }}>
                    LEARN
                  </Label>
                </View>
              </View>
              <View
                accessibilityRole="toolbar"
                accessibilityLabel={t('Langue', 'Language', 'اللغة')}
                style={{ flexDirection: row, gap: 2 }}
              >
                {(['ar', 'fr', 'en'] as const).map((language) => (
                  <Pressable
                    key={language}
                    accessibilityRole="button"
                    accessibilityLabel={{ ar: 'العربية', fr: 'Français', en: 'English' }[language]}
                    accessibilityState={{ selected: state.language === language }}
                    onPress={() => update((p) => ({ ...p, language }))}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      paddingHorizontal: compact ? 7 : 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottomWidth: 2,
                      borderBottomColor:
                        state.language === language ? colors.accent : 'transparent',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Label
                      size={11}
                      bold={state.language === language}
                      style={{ color: state.language === language ? colors.text : colors.muted }}
                    >
                      {{ ar: 'العربية', fr: 'FR', en: 'EN' }[language]}
                    </Label>
                  </Pressable>
                ))}
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: wide ? row : 'column',
                alignItems: wide ? 'center' : 'stretch',
                justifyContent: 'center',
                gap: wide ? 80 : 26,
                paddingTop: wide ? 60 : 34,
                paddingBottom: wide ? 60 : 24,
              }}
            >
              <View
                style={{
                  flex: wide ? 1 : undefined,
                  gap: wide ? 26 : 12,
                  alignItems: wide ? (rtl ? 'flex-end' : 'flex-start') : 'center',
                }}
              >
                <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 18, height: 1, backgroundColor: colors.gold }} />
                  <Label
                    size={10}
                    bold
                    style={{ color: colors.accent, letterSpacing: rtl ? 0 : 2 }}
                  >
                    {t('L’APPRENTISSAGE, POUR VOUS', 'LEARNING, MADE PERSONAL', 'رحلة تعلّم تشبهك')}
                  </Label>
                </View>
                <Label
                  bold
                  size={wide ? 54 : compact ? 30 : 35}
                  accessibilityRole="header"
                  style={{
                    textAlign: wide ? (rtl ? 'right' : 'left') : 'center',
                    lineHeight: wide ? 68 : 47,
                    letterSpacing: rtl ? 0 : -1.5,
                  }}
                >
                  {t(
                    'Les grandes idées\ncommencent ici.',
                    'Great ideas\nstart here.',
                    'هنا تبدأ\nأفكارك الكبيرة.',
                  )}
                </Label>
                <Label
                  size={wide ? 16 : 13}
                  muted
                  style={{
                    maxWidth: 340,
                    textAlign: wide ? (rtl ? 'right' : 'left') : 'center',
                    lineHeight: wide ? 27 : 22,
                  }}
                >
                  {t(
                    'Un espace à vous pour comprendre, pratiquer et donner vie à vos idées.',
                    'Your own space to understand, practise, and bring your ideas to life.',
                    'مساحتك الخاصة للفهم والتجربة، وتحويل أفكارك إلى واقع.',
                  )}
                </Label>
                {wide && (
                  <View
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                      width: '100%',
                      height: 220,
                      marginTop: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: 100,
                        borderWidth: 1,
                        borderColor: colors.line,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        width: 280,
                        height: 140,
                        borderRadius: 90,
                        borderWidth: 1,
                        borderColor: colors.line,
                        transform: [{ rotate: '-25deg' }],
                      }}
                    />
                    <View
                      style={{
                        width: 125,
                        height: 156,
                        borderRadius: 12,
                        borderLeftWidth: 9,
                        borderLeftColor: '#0C3026',
                        backgroundColor: '#173F35',
                        transform: [{ rotate: '-12deg' }],
                        padding: 22,
                        justifyContent: 'space-between',
                        boxShadow: '14px 16px 0 rgba(23,63,53,0.07)',
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={29} color="#DEEEB7" />
                      <View style={{ gap: 6 }}>
                        <View style={{ width: 52, height: 3, backgroundColor: '#DEEEB7' }} />
                        <View style={{ width: 32, height: 3, backgroundColor: '#82A18B' }} />
                      </View>
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        top: 24,
                        right: 45,
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: isDark ? colors.soft : '#E8EEDC',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ rotate: '10deg' }],
                      }}
                    >
                      <Ionicons name="bulb-outline" size={22} color={colors.accent} />
                    </View>
                  </View>
                )}
                {wide && (
                  <View style={{ flexDirection: row, gap: 22 }}>
                    {[
                      ['01', t('Comprendre', 'Understand', 'افهم')],
                      ['02', t('Pratiquer', 'Practise', 'جرّب')],
                      ['03', t('Créer', 'Create', 'ابتكر')],
                    ].map(([n, label]) => (
                      <View key={n} style={{ flexDirection: row, gap: 7, alignItems: 'center' }}>
                        <Label size={10} style={{ color: colors.gold }}>
                          {n}
                        </Label>
                        <Label size={12} muted>
                          {label}
                        </Label>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View
                style={{
                  width: wide ? 420 : '100%',
                  maxWidth: 460,
                  alignSelf: 'center',
                  backgroundColor: colors.card,
                  borderRadius: 24,
                  padding: wide ? 34 : compact ? 22 : 28,
                  borderWidth: 1,
                  borderColor: colors.line,
                  boxShadow: isDark
                    ? '0 20px 60px rgba(0,0,0,0.15)'
                    : '0 12px 48px rgba(24,52,38,0.055)',
                  gap: 18,
                }}
              >
                {!!error && (
                  <View style={{ gap: 8 }}>
                    <Label accessibilityRole="alert" style={{ color: colors.danger }}>
                      {error}
                    </Label>
                    <Pressable accessibilityRole="button" onPress={retry}>
                      <Label bold>{t('Réessayer', 'Retry', 'أعد المحاولة')}</Label>
                    </Pressable>
                  </View>
                )}
                {ready ? children : <ActivityIndicator color={colors.accent} />}
              </View>
            </View>
            <View
              style={{ flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
              <Label size={10} muted>
                {t(
                  'Une académie personnelle. Un accès privé.',
                  'A personal academy. A private space.',
                  'أكاديمية شخصية. مساحة خاصة.',
                )}
              </Label>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  password = false,
  visible = false,
  onToggle,
  disabled,
  onSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  password?: boolean;
  visible?: boolean;
  onToggle?: () => void;
  disabled: boolean;
  onSubmit?: () => void;
}) {
  const { colors, rtl, t } = useSchool();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Label size={13} bold>
        {label}
      </Label>
      <View
        style={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          minHeight: 56,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: focused ? colors.accent : colors.line,
          backgroundColor: colors.card,
          boxShadow: focused ? '0 0 0 3px ' + colors.soft : 'none',
          opacity: disabled ? 0.6 : 1,
          gap: 12,
        }}
      >
        <Ionicons
          name={password ? 'lock-closed-outline' : 'mail-outline'}
          size={18}
          color={focused ? colors.accent : colors.muted}
        />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={!disabled}
          underlineColorAndroid="transparent"
          selectionColor={colors.soft}
          selectionHandleColor={colors.accent}
          cursorColor={colors.accent}
          autoComplete={password ? 'current-password' : 'email'}
          keyboardType={password ? 'default' : 'email-address'}
          secureTextEntry={password && !visible}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType={password ? 'go' : 'next'}
          onSubmitEditing={onSubmit}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 52,
            paddingVertical: 12,
            paddingHorizontal: 0,
            borderWidth: 0,
            backgroundColor: colors.card,
            fontFamily: rtl ? fonts.arabic : fonts.body,
            fontSize: 16,
            color: colors.text,
            textAlign: rtl && !value ? 'right' : 'left',
            writingDirection: value ? 'ltr' : rtl ? 'rtl' : 'ltr',
            ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
          }}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible
                ? t('Masquer le mot de passe', 'Hide password', 'إخفاء كلمة المرور')
                : t('Afficher le mot de passe', 'Show password', 'إظهار كلمة المرور')
            }
            accessibilityState={{ checked: visible, disabled }}
            disabled={disabled}
            onPress={onToggle}
            hitSlop={4}
            style={{ width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
