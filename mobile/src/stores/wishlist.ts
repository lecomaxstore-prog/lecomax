import { useCommerceStore } from "@/stores/commerce";

/** Wishlist store entry point. Persistence is provided by the shared commerce store. */
export const useWishlistStore = useCommerceStore;
