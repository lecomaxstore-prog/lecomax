import { LearningReminderRenewal } from '../features/LearningReminderRenewal';
import { ProgressSyncRunner } from '../components/SyncProgress';
import { ChangeHistoryProvider } from '../store/ChangeHistory';
import { OwnerGate } from '../features/OwnerGate';
import { ResumeNavigation } from '../features/ResumeNavigation';
import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  Text,
  View,
  Pressable,
  useColorScheme,
} from 'react-native';
import { dark, light } from '../constants/design';
import { SchoolProvider, useSchool } from '../store/School';
import { NotificationBridge } from '../features/NotificationBridge';
import { JourneyProvider } from '../features/wellness/useJourney';
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const colors = useColorScheme() === 'dark' ? dark : light;
  return (
    <View style={{ flex: 1, padding: 28, justifyContent: 'center', backgroundColor: colors.bg }}>
      <View
        style={{
          width: '100%',
          maxWidth: 440,
          alignSelf: 'center',
          gap: 20,
          borderRadius: 24,
          padding: 28,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <Text style={{ color: colors.accent, fontSize: 11, letterSpacing: 1.5 }}>
          ACADEMY
        </Text>
        <Text
          accessibilityRole="alert"
          style={{ color: colors.text, fontSize: 23, lineHeight: 36 }}
        >
          تعذر عرض الشاشة{'\n'}Unable to open this screen
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 25 }}>
          حاول فتحها من جديد.{'\n'}Try opening it again.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={({ pressed }) => ({
            minHeight: 50,
            padding: 14,
            alignItems: 'center',
            borderRadius: 14,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 16 }}>أعد المحاولة / Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}
function Navigation() {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  const { colors, t } = useSchool();
  const recipient = usePathname() === '/phone-share';
  return (
    <>
      <StatusBar style={colors.bg === dark.bg ? 'light' : 'dark'} />
      {!recipient && <><NotificationBridge /><LearningReminderRenewal /></>}
      {!recipient && <><ResumeNavigation /><ProgressSyncRunner /></>}
      <Stack
        screenOptions={{
          animation: reducedMotion ? 'none' : 'fade',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                'ACADEMY — Accueil',
                'ACADEMY — Home',
                'ACADEMY — الرئيسية',
              )}
              onPress={() => router.navigate('/(tabs)')}
              style={({ pressed }) => ({
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Image
                source={require('../assets/icon.png')}
                accessible={false}
                resizeMode="contain"
                style={{ width: 34, height: 34, borderRadius: 10 }}
              />
              <Text
                numberOfLines={1}
                style={{ color: colors.text, fontSize: 17, fontWeight: '600', flexShrink: 1 }}
              >
                ACADEMY
              </Text>
            </Pressable>
          ),
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="wellness" options={{ headerShown: false }} />
        <Stack.Screen name="wellness/progress" options={{ headerShown: false }} />
        <Stack.Screen name="wellness/preferences" options={{ headerShown: false }} />
        <Stack.Screen name="wellness/notifications" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
export default function Layout() {
  const [fontsReady, fontError] = useFonts({
    AcademyNotoArabic: require('../assets/fonts/NotoSansArabic-Regular.ttf'),
    AcademyNotoArabicSemibold: require('../assets/fonts/NotoSansArabic-SemiBold.ttf'),
  });
  if (!fontsReady && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: light.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          color={light.primary}
          accessibilityLabel="Loading Academy / تحميل الأكاديمية"
        />
      </View>
    );
  return (
    <SchoolProvider>
      <OwnerGate>
        <ChangeHistoryProvider>
          <JourneyProvider>
            <Navigation />
          </JourneyProvider>
        </ChangeHistoryProvider>
      </OwnerGate>
    </SchoolProvider>
  );
}
