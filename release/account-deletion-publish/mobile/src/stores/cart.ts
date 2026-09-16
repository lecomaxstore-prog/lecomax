import { useCommerceStore } from "@/stores/commerce";

/** Cart store entry point. Kept on the shared commerce store so legacy screens stay in sync. */
export const useCartStore = useCommerceStore;
