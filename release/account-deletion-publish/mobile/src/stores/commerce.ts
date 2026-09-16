import { selectedInventory, preorderSnapshot } from "@/lib/purchasability";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WishlistVariant } from "@/lib/wishlist-utils";
import {
  cartLineAvailableStock,
  reconcileCartProducts,
  type CartReconciliationResult,
} from "@/lib/cart-reconciliation";
import type { CartLine, Product } from "@/types/commerce";
import { triggerMediumHaptic, triggerSelectionHaptic } from "@/services/haptics";

type CommerceState = {
  cart: CartLine[];
  wishlist: string[];
  wishlistSelections: Record<string, WishlistVariant>;
  recent: Product[];
  coupon?: string;
  addToCart: (
    product: Product,
    options?: { color?: string; size?: string; quantity?: number },
  ) => void;
  removeFromCart: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeCartLine: (id: string, color?: string, size?: string) => void;
  setLineQuantity: (
    id: string,
    quantity: number,
    color?: string,
    size?: string,
  ) => void;
  refreshCartProducts: (products: Product[]) => CartReconciliationResult;
  toggleWishlist: (id: string, selection?: WishlistVariant) => void;
  replaceWishlist: (ids: string[]) => void;
  replaceWishlistSelections: (
    selections: Record<string, WishlistVariant>,
  ) => void;
  setWishlistSelection: (id: string, selection: WishlistVariant) => void;
  view: (product: Product) => void;
  setCoupon: (coupon?: string) => void;
  clearCart: () => void;
};

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      wishlistSelections: {},
      recent: [],
      addToCart: (product, options) => {
        void triggerMediumHaptic();
        set((state) => {
          const amount = Math.max(
            1,
            Math.min(20, Math.floor(options?.quantity ?? 1)),
          );
          const existing = state.cart.find(
            (line) =>
              line.product.id === product.id &&
              line.color === options?.color &&
              line.size === options?.size,
          );
          const maximum = cartLineAvailableStock(product, {
            product,
            quantity: amount,
            color: options?.color,
            size: options?.size,
          });
          if (maximum <= 0) return state;
          return {
            cart: existing
              ? state.cart.map((line) =>
                  line === existing
                    ? {
                        ...line,
                        product,
                        ...preorderSnapshot(product,selectedInventory(product,line.color,line.size),Math.min(maximum,line.quantity+amount)),
                        quantity: Math.min(maximum, line.quantity + amount),
                      }
                    : line,
                )
              : [
                  ...state.cart,
                  {
                    product,
                    ...preorderSnapshot(product,selectedInventory(product,options?.color,options?.size),Math.min(maximum,amount)),
                    quantity: Math.min(maximum, amount),
                    color: options?.color,
                    size: options?.size,
                  },
                ],
          };
        });
      },
      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((line) => line.product.id !== id),
        })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((line) => line.product.id !== id)
              : state.cart.map((line) =>
                  line.product.id === id ? { ...line, ...preorderSnapshot(line.product,selectedInventory(line.product,line.color,line.size),Math.min(20,quantity)), quantity: Math.min(20,quantity) } : line,
                ),
        })),
      removeCartLine: (id, color, size) =>
        set((state) => ({
          cart: state.cart.filter(
            (line) =>
              !(
                line.product.id === id &&
                line.color === color &&
                line.size === size
              ),
          ),
        })),
      setLineQuantity: (id, quantity, color, size) =>
        set((state) => ({
          cart: state.cart.flatMap((line) => {
            const matches =
              line.product.id === id &&
              line.color === color &&
              line.size === size;
            if (!matches) return [line];
            if (!Number.isFinite(quantity)) return [line];
            const nextQuantity = Math.min(20, Math.max(0, Math.floor(quantity)));
            return nextQuantity <= 0 ? [] : [{ ...line, quantity: nextQuantity,
              ...preorderSnapshot(line.product, selectedInventory(line.product, line.color, line.size), nextQuantity) }];
          }),
        })),
      refreshCartProducts: (products) => {
        const result = reconcileCartProducts(get().cart, products);
        set((state) => ({
          cart: result.cart,
          coupon:
            result.removed.length || result.adjusted.length
              ? undefined
              : state.coupon,
        }));
        return result;
      },
      toggleWishlist: (id, selection) => {
        void triggerSelectionHaptic();
        set((state) => {
          const removing = state.wishlist.includes(id);
          const wishlistSelections = { ...state.wishlistSelections };
          if (removing) delete wishlistSelections[id];
          else if (selection?.color || selection?.size) {
            wishlistSelections[id] = selection;
          }
          return {
            wishlist: removing
              ? state.wishlist.filter((item) => item !== id)
              : [...state.wishlist, id],
            wishlistSelections,
          };
        });
      },
      replaceWishlist: (wishlist) =>
        set((state) => {
          const unique = [...new Set(wishlist)];
          const valid = new Set(unique);
          return {
            wishlist: unique,
            wishlistSelections: Object.fromEntries(
              Object.entries(state.wishlistSelections).filter(([id]) =>
                valid.has(id),
              ),
            ),
          };
        }),
      replaceWishlistSelections: (wishlistSelections) =>
        set({ wishlistSelections }),
      setWishlistSelection: (id, selection) =>
        set((state) => ({
          wishlistSelections: {
            ...state.wishlistSelections,
            [id]: selection,
          },
        })),
      view: (product) =>
        set((state) => ({
          recent: [
            product,
            ...state.recent.filter((item) => item.id !== product.id),
          ].slice(0, 12),
        })),
      setCoupon: (coupon) => set({ coupon }),
      clearCart: () => set({ cart: [], coupon: undefined }),
    }),
    {
      name: "lecomax-commerce",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ cart, wishlist, wishlistSelections, recent, coupon }) => ({
        cart,
        wishlist,
        wishlistSelections,
        recent,
        coupon,
      }),
    },
  ),
);
