import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSchool } from '../store/School';
import { Label, Row } from './UI';

export function DeviceLabsSection() {
  const { t, colors, rtl } = useSchool();
  const labs = [
    {
      route: '/phone-lab' as const,
      icon: 'phone-portrait-outline' as const,
      title: t('Dans ton téléphone', 'Inside your phone', 'داخل هاتفك'),
      description: t('Explore les pièces et leur lien avec les logiciels.', 'Explore the parts and how they work with software.', 'اكتشف القطع وكيف تعمل مع البرامج.'),
      tags: t('Écran · Batterie · Circuits', 'Screen · Battery · Circuits', 'الشاشة · البطارية · الدوائر'),
    },
    {
      route: '/pc-lab' as const,
      icon: 'laptop-outline' as const,
      title: t('Dans ton ordinateur', 'Inside your computer', 'داخل حاسوبك'),
      description: t('Découvre les composants et leur rôle, pièce par pièce.', 'Discover the components and what each one does.', 'تعرّف على المكوّنات ودور كل قطعة.'),
      tags: t('Processeur · Graphismes · Mémoire', 'Processor · Graphics · Memory', 'المعالج · الرسوميات · الذاكرة'),
    },
  ];

  return <View style={{ gap: 12 }}>
    <View style={{ gap: 4 }}>
      <Label bold size={18} accessibilityRole="header">{t('Explore tes appareils', 'Explore your devices', 'اكتشف أجهزتك')}</Label>
      <Label muted size={13}>{t('Regarde à l’intérieur. Choisis une pièce pour comprendre.', 'Look inside. Choose a part to learn how it works.', 'شوف من الداخل، واختار قطعة باش تفهم كيف خدامة.')}</Label>
    </View>
    {labs.map(lab => <Pressable
      key={lab.route}
      accessibilityRole="button"
      accessibilityLabel={lab.title}
      accessibilityHint={lab.description}
      onPress={() => router.push(lab.route)}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.line,
        backgroundColor: pressed ? colors.soft : colors.card,
        borderRadius: 22,
        padding: 18,
        gap: 16,
        minHeight: 148,
      })}
    >
      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 14 }}>
        <View style={{ width: 52, height: 58, borderRadius: 16, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ionicons name={lab.icon} size={29} color={colors.accent} accessible={false} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Label bold size={17}>{lab.title}</Label>
          <Label muted size={13}>{lab.description}</Label>
        </View>
      </Row>
      <Row style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, justifyContent: 'space-between', gap: 10 }}>
        <Label muted size={11} style={{ flexShrink: 1 }}>{lab.tags}</Label>
        <Row style={{ flexWrap: 'nowrap', gap: 5 }}>
          <Label bold size={12} style={{ color: colors.accent }}>{t('Explorer', 'Explore', 'اكتشف')}</Label>
          <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.accent} accessible={false} />
        </Row>
      </Row>
    </Pressable>)}
  </View>;
}
