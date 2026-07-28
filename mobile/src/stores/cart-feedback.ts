import { create } from "zustand";

type CartFlight = {
  id: number;
  image?: string;
  originX: number;
  originY: number;
};

type CartFeedbackState = {
  flight: CartFlight | null;
  startFlight: (flight: Omit<CartFlight, "id">) => void;
  clearFlight: (id: number) => void;
};

export const useCartFeedbackStore = create<CartFeedbackState>((set) => ({
  flight: null,
  startFlight: (flight) => set({ flight: { ...flight, id: Date.now() } }),
  clearFlight: (id) =>
    set((state) => (state.flight?.id === id ? { flight: null } : state)),
}));
