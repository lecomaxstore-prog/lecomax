/**
 * GA4 ecommerce event helpers — all calls are safe (no-op if gtag not loaded).
 * Currency is always MAD.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gtag(...args: any[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export type GaItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity?: number;
  item_variant?: string; // size / color combo
};

/** Fired when a user views a product detail page */
export function trackViewItem(item: GaItem) {
  gtag("event", "view_item", {
    currency: "MAD",
    value: item.price,
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  });
}

/** Fired when a user adds a product to cart */
export function trackAddToCart(item: GaItem) {
  gtag("event", "add_to_cart", {
    currency: "MAD",
    value: item.price * (item.quantity ?? 1),
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  });
}

/** Fired when a user removes a product from cart */
export function trackRemoveFromCart(item: GaItem) {
  gtag("event", "remove_from_cart", {
    currency: "MAD",
    value: item.price * (item.quantity ?? 1),
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  });
}

/** Fired when the checkout page loads with items */
export function trackBeginCheckout(items: GaItem[], value: number) {
  gtag("event", "begin_checkout", {
    currency: "MAD",
    value,
    items,
  });
}

/** Fired after a successful order submission */
export function trackPurchase({
  transactionId,
  value,
  shipping,
  items,
}: {
  transactionId: string;
  value: number;
  shipping: number;
  items: GaItem[];
}) {
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "MAD",
    value,
    shipping,
    items,
  });
}
