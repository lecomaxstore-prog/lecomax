import React from 'react';
import { ScrollView } from 'react-native';
import { PhoneInternetInvitation } from '../components/PhoneInternetInvitation';
import { useSchool } from '../store/School';

export default function InternetPhone() {
  const { colors } = useSchool();
  return <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
    <PhoneInternetInvitation blocked={false} />
  </ScrollView>;
}
