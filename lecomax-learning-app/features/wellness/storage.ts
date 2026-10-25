import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialJourney, parseJourney } from './engine';
import type { JourneyState } from './types';
export const JOURNEY_KEY = 'lecomax.wellness.v1';
export async function readJourney() {
  const raw = await AsyncStorage.getItem(JOURNEY_KEY);
  return raw ? parseJourney(raw) : initialJourney();
}
let queue: Promise<void> = Promise.resolve();
export function saveJourney(state: JourneyState) {
  const raw = JSON.stringify(state);
  const operation = queue.catch(() => {}).then(() => AsyncStorage.setItem(JOURNEY_KEY, raw));
  queue = operation;
  return operation;
}
