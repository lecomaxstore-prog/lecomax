import React from 'react';
import { Platform, View } from 'react-native';
import { KaliDesktop } from '../components/KaliDesktop';
import { useSchool } from '../store/School';
export default function KaliPage() {
  const { colors } = useSchool();
  return <View style={{ flex: 1, padding: 12, backgroundColor: Platform.OS === 'web' ? '#101820' : colors.bg }}><KaliDesktop /></View>;
}
