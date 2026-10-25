import React from 'react';
import { TextInput } from 'react-native';
export function CodeEditor({ value, onChange, fontSize }: { value: string; onChange: (s: string) => void; language: string; fontSize: number }) {
  return <TextInput accessibilityLabel="Source code" multiline autoCapitalize="none" autoCorrect={false} value={value} onChangeText={onChange} maxLength={32000} style={{ minHeight: 320, fontFamily: 'monospace', fontSize, textAlign: 'left', writingDirection: 'ltr', backgroundColor: '#172331', color: '#f4f7fa', padding: 12 }} />;
}
