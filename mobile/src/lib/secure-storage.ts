import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function secureGetItem(key: string) {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  const encrypted = await SecureStore.getItemAsync(key);
  if (encrypted !== null) return encrypted;

  // One-time migration for values written before encrypted persistence existed.
  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await SecureStore.setItemAsync(key, legacy, secureOptions);
    await AsyncStorage.removeItem(key);
  }
  return legacy;
}

export async function secureSetItem(key: string, value: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
  await SecureStore.setItemAsync(key, value, secureOptions);
  await AsyncStorage.removeItem(key);
}

export async function secureRemoveItem(key: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(key);
  await Promise.all([
    SecureStore.deleteItemAsync(key),
    AsyncStorage.removeItem(key),
  ]);
}

export const secureStateStorage: StateStorage = {
  getItem: secureGetItem,
  setItem: secureSetItem,
  removeItem: secureRemoveItem,
};
