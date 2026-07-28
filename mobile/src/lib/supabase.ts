import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { runtimeConfig } from "@/lib/runtime-config";

const url = runtimeConfig.supabaseUrl || "https://unconfigured.invalid";
const key = runtimeConfig.supabaseAnonKey || "unconfigured-anon-key";

export const isSupabaseConfigured = Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey);

const secureStorage = {
  getItem: (key: string) => Platform.OS === "web" ? (typeof window === "undefined" ? Promise.resolve(null) : AsyncStorage.getItem(key)) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => Platform.OS === "web" ? (typeof window === "undefined" ? Promise.resolve() : AsyncStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }),
  removeItem: (key: string) => Platform.OS === "web" ? (typeof window === "undefined" ? Promise.resolve() : AsyncStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(url, key, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
