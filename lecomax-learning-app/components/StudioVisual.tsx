import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Label, Row } from './UI';
import { useSchool } from '../store/School';

/** Code-native academy artwork: scales on web and native without image downloads. */
export function StudioVisual({ compact = false }: { compact?: boolean }) {
  const { t } = useSchool();
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ padding: compact ? 18 : 26, backgroundColor: '#152E2B', borderRadius: 20, borderWidth: 1, borderColor: '#42645A', gap: 20, overflow: 'hidden' }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Row style={{ gap: 5 }}>{['#D9B88B', '#9FBDA3', '#75BDA8'].map(color => <View key={color} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />)}</Row>
      <Label size={10} style={{ color: '#B7CEC3', letterSpacing: 2 }}>LEARN / BUILD / GROW</Label>
    </Row>
    <View style={{ gap: 8, paddingVertical: compact ? 0 : 10 }}>
      <Label size={12} style={{ color: '#95B6AA', writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>01  &lt;your-future&gt;</Label>
      <Label bold size={compact ? 30 : 44} style={{ color: '#E9F5DE', writingDirection: 'ltr', textAlign: 'center', letterSpacing: -2 }}>{'{ idea → reality }'}</Label>
      <Label size={12} style={{ color: '#95B6AA', writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>02  &lt;/your-future&gt;</Label>
    </View>
    <Row style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: '#42645A', flexWrap: 'nowrap', gap: 10 }}>
      <Ionicons name="code-working-outline" size={24} color="#D9EDBD" />
      <Label size={12} style={{ flex: 1, color: '#DBE9E1' }}>{t('Une idée. Un premier projet. Votre prochaine étape.', 'One idea. Your first project. A new beginning.', 'فكرة واحدة. أول مشروع. بداية جديدة.')}</Label>
    </Row>
  </View>;
}
