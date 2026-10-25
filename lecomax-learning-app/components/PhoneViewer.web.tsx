import React from 'react';
import { Linking } from 'react-native';
import { Button, Label } from './UI';

export function PhoneViewer({ origin, onClose }: { origin: string; onClose: () => void }) {
  return <><Label>Use the Android app for the built-in phone viewer. In a browser, keep the viewer open and approve on your other phone.</Label>
    <Button title="Open browser viewer" onPress={() => { void Linking.openURL(origin); }} />
    <Button title="Back" onPress={onClose} /></>;
}
