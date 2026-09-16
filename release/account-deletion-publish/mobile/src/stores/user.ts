import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStateStorage } from "@/lib/secure-storage";

export type SavedAddress = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  /** Keep website address details when editing through the app's single input. */
  websiteAddress?: { label: string; line1: string; line2: string; zip: string; country: string };
};

type UserState = {
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  setUser: (user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
  }) => void;
  saveAddress: (address: Omit<SavedAddress, "id"> & { id?: string }) => string;
  selectAddress: (id: string) => void;
  removeAddress: (id: string) => void;
  replaceAddresses: (addresses: SavedAddress[], selectedAddressId?: string | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: null,
      email: null,
      phone: null,
      city: null,
      address: null,
      addresses: [],
      selectedAddressId: null,
      setUser: (user) => set((state) => ({ ...state, ...user })),
      saveAddress: (address) => {
        const id = address.id || `address-${Date.now()}`;
        set((state) => {
          const saved = { ...address, id };
          const addresses = state.addresses ?? [];
          const exists = addresses.some((item) => item.id === id);
          return {
            addresses: exists
              ? addresses.map((item) => item.id === id ? { ...item, ...saved } : item)
              : [...addresses, saved],
            selectedAddressId: id,
            name: saved.name,
            email: saved.email,
            phone: saved.phone,
            city: saved.city,
            address: saved.address,
          };
        });
        return id;
      },
      selectAddress: (id) =>
        set((state) => {
          const selected = (state.addresses ?? []).find((item) => item.id === id);
          if (!selected) return state;
          return {
            selectedAddressId: id,
            name: selected.name,
            email: selected.email,
            phone: selected.phone,
            city: selected.city,
            address: selected.address,
          };
        }),
      removeAddress: (id) =>
        set((state) => {
          const addresses = (state.addresses ?? []).filter((item) => item.id !== id);
          const selectedAddressId = state.selectedAddressId === id
            ? addresses[0]?.id ?? null
            : state.selectedAddressId;
          const selected = addresses.find((item) => item.id === selectedAddressId) ?? addresses[0];
          return {
            addresses,
            selectedAddressId,
            name: selected?.name ?? state.name,
            email: selected?.email ?? state.email,
            phone: selected?.phone ?? state.phone,
            city: selected?.city ?? state.city,
            address: selected?.address ?? state.address,
          };
        }),
      replaceAddresses: (addresses, preferredId) =>
        set((state) => {
          const selectedAddressId = addresses.some((item) => item.id === preferredId)
            ? preferredId ?? null
            : addresses[0]?.id ?? null;
          const selected = addresses.find((item) => item.id === selectedAddressId);
          return {
            addresses,
            selectedAddressId,
            name: selected?.name ?? state.name,
            email: selected?.email ?? state.email,
            phone: selected?.phone ?? state.phone,
            city: selected?.city ?? state.city,
            address: selected?.address ?? state.address,
          };
        }),
      clearUser: () => set({
        name: null,
        email: null,
        phone: null,
        city: null,
        address: null,
        addresses: [],
        selectedAddressId: null,
      }),
    }),
    {
      name: "lecomax-user",
      storage: createJSONStorage(() => secureStateStorage),
    },
  ),
);
