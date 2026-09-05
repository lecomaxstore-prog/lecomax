import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { withSessionTimeout } from "@/lib/session-timeout";

export function useSupportActive() {
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);
  return focused && foreground;
}

export function useSupportAccount() {
  const [account, setAccount] = useState<{ ready: boolean; id: string | null; error?: string }>({ ready: false, id: null });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setAccount({ ready: false, id: null });
    setAttempt(value => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    let changed = false;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      changed = true;
      if (active) setAccount({ ready: true, id: session?.user.id ?? null });
    });
    void withSessionTimeout(supabase.auth.getSession()).then(({ data: sessionData, error }) => {
      if (error) throw error;
      if (active && !changed) setAccount({ ready: true, id: sessionData.session?.user.id ?? null });
    }).catch(() => { if (active && !changed) setAccount({ ready: true, id: null, error: "Impossible de vérifier votre session. Réessayez." }); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [attempt]);
  return { ...account, retry };
}
