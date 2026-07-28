import { apiRequest } from "@/lib/api-client";
import type { CartLine } from "@/types/commerce";

export type AppliedCoupon = {
  id: string;
  code: string;
  discount: number;
  eligible_subtotal: number;
  excluded_items_count: number;
};

export function validateCoupon(code: string, cart: CartLine[]) {
  return apiRequest<AppliedCoupon>("/api/coupons/validate", {
    method: "POST",
    body: JSON.stringify({
      code: code.trim().toUpperCase(),
      items: cart.map((line) => ({
        slug: line.product.slug,
        quantity: line.quantity,
      })),
    }),
  });
}
