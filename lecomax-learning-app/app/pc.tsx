import React from 'react';
import { View } from 'react-native';
import { PcDesktop } from '../components/PcDesktop';
import { useSchool } from '../store/School';
export default function PcPage() {
  const { colors } = useSchool();
  return <View style={{ flex: 1, padding: 8, backgroundColor: colors.bg }}><PcDesktop /></View>;
}
