import { STORE_TABLE_QUERIES } from "@/lib/store-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useEffect } from "react";
import { AppState } from "react-native";
import { useLocales } from "expo-localization";
import { useColorScheme } from "nativewind";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { usePreferences } from "@/stores/preferences";
import { useCommerceStore } from "@/stores/commerce";
import { getProducts } from "@/services/catalog";
import {
  mergeAccountWishlist,
  replaceAccountWishlist,
} from "@/services/wishlist";
import {
  loadAccountAddresses,
  saveAccountAddresses,
} from "@/services/addresses";
import { useUserStore } from "@/stores/user";
import {
  isPublicPersistedQuery,
  QUERY_CACHE_BUSTER,
} from "@/lib/persistence-policy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});

function catalogueProducts() {
  return queryClient.ensureQueryData({
    queryKey: ["products"],
    queryFn: ({ signal }) => getProducts(signal),
    staleTime: 60_000,
  });
}
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "LECOMAX_QUERY_CACHE",
});

function ThemeSync() {
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    setColorScheme("light");
  }, [setColorScheme]);
  return null;
}

function LanguageSync() {
  const locales = useLocales();
  const sync = usePreferences((state) => state.syncDeviceLanguage);
  useEffect(() => { sync(); }, [locales, sync]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => subscription.remove();
  }, [sync]);
  return null;
}

export function AppProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    let syncing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const mergeAddresses = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const remote = await loadAccountAddresses();
      const local = useUserStore.getState().addresses ?? [];
      const byId = new Map(local.map((address) => [address.id, address]));
      for (const address of remote.addresses) byId.set(address.id, address);
      const merged = [...byId.values()].slice(0, 10);
      const selectedId =
        remote.defaultId ??
        useUserStore.getState().selectedAddressId ??
        merged[0]?.id ??
        null;
      syncing = true;
      useUserStore.getState().replaceAddresses(merged, selectedId);
      syncing = false;
      if (merged.length !== remote.addresses.length) {
        await saveAccountAddresses(merged, selectedId);
      }
    };

    const auth = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void mergeAddresses().catch(() => {});
    });
    void mergeAddresses().catch(() => {});

    const unsubscribe = useUserStore.subscribe((state, previous) => {
      if (
        syncing ||
        (state.addresses === previous.addresses &&
          state.selectedAddressId === previous.selectedAddressId)
      )
        return;
      if (timer) clearTimeout(timer);
      const previousAddresses = previous.addresses;
      const previousSelectedId = previous.selectedAddressId;
      timer = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        try {
          await saveAccountAddresses(state.addresses, state.selectedAddressId);
        } catch {
          syncing = true;
          useUserStore
            .getState()
            .replaceAddresses(previousAddresses, previousSelectedId);
          syncing = false;
        }
      }, 400);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let syncing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const merge = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const products = await catalogueProducts();
      const commerce = useCommerceStore.getState();
      const merged = await mergeAccountWishlist(
        commerce.wishlist,
        commerce.wishlistSelections,
        products,
      );
      syncing = true;
      useCommerceStore.getState().replaceWishlist(merged.ids);
      useCommerceStore.getState().replaceWishlistSelections(merged.selections);
      syncing = false;
    };

    const auth = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void merge().catch(() => {});
    });
    void merge().catch(() => {});

    const unsubscribe = useCommerceStore.subscribe((state, previous) => {
      if (
        syncing ||
        (state.wishlist === previous.wishlist &&
          state.wishlistSelections === previous.wishlistSelections)
      )
        return;
      if (timer) clearTimeout(timer);
      const previousWishlist = previous.wishlist;
      const previousSelections = previous.wishlistSelections;
      timer = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        try {
          const products = await catalogueProducts();
          const saved = await replaceAccountWishlist(
            state.wishlist,
            state.wishlistSelections,
            products,
          );
          syncing = true;
          useCommerceStore.getState().replaceWishlist(saved.ids);
          useCommerceStore
            .getState()
            .replaceWishlistSelections(saved.selections);
          syncing = false;
        } catch {
          syncing = true;
          useCommerceStore.getState().replaceWishlist(previousWishlist);
          useCommerceStore
            .getState()
            .replaceWishlistSelections(previousSelections);
          syncing = false;
        }
      }, 350);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel("mobile-catalog");
    for (const [table, queryKeys] of Object.entries(STORE_TABLE_QUERIES)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const key of queryKeys) void queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            isPublicPersistedQuery(query.queryKey),
        },
      }}
    >
      <ThemeSync />
      <LanguageSync />
      {children}
    </PersistQueryClientProvider>
  );
}
