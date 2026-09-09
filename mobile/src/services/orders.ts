import { msg } from "@/i18n";
import { apiRequest } from "@/lib/api-client";
import type { AppliedCoupon } from "@/services/coupons";
import type { CartLine } from "@/types/commerce";

export type CheckoutPayload = { name: string; email: string; phone: string; city: string; address: string; notes?: string; payment: "cod" | "paypal" };
export type ShippingQuote = { cost: number; estimatedDays?: string; zoneName?: string };
type CreatedOrder = { items?: CustomerOrder["items"]; order_number: string; id: string; duplicate?: boolean };
export type PayPalCapture = { orderId: string; captureId: string };
export type PaymentMethod = {
  provider: "cod" | "paypal";
  title: string;
  description: string;
  recommended: boolean;
  fee: number;
  available: boolean;
  unavailableReason: string;
};
export type CheckoutQuote = import("../../../lib/commerce-contract").CartCalculation;
export type CustomerOrder = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  tracking_number?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
  items: {
    fulfillment_type?: "STANDARD" | "PREORDER";
    preorder_estimated_at?: string | null;
    preorder_message?: string | null;
    slug: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    color?: string;
    size?: string;
  }[];
};

export type TrackingOrder = {
  id: string;
  order_number: string;
  status: string;
  status_label: string;
  step: number;
  tracking_number?: string | null;
  total: number;
  shipping: number;
  payment_method?: string | null;
  created_at: string;
  customer: { name: string; city: string; address: string };
  items: CustomerOrder["items"];
};

export function createCheckoutRequestId() {
  const random = Math.random().toString(36).slice(2);
  return `mobile_${Date.now().toString(36)}_${random}_${Math.random().toString(36).slice(2)}`;
}

export async function createOrder(
  customer: CheckoutPayload,
  cart: CartLine[],
  confirmedQuote?: ShippingQuote,
  idempotencyKey = createCheckoutRequestId(),
  coupon?: AppliedCoupon,
  additionalDiscount = 0,
  paypalCapture?: PayPalCapture,
  paymentFee = 0,
  confirmedPricing?: CheckoutQuote,
) {
  if (!cart.length) throw new Error(msg("orders.theCartIsEmpty"));
  if (!confirmedPricing) throw new Error("Veuillez vérifier le montant de la commande avant de confirmer.");
  const shipping = confirmedPricing.shipping;
  const discount = confirmedPricing.discount;
  const safePaymentFee = confirmedPricing.paymentFee;
  const order = {
    customer: { name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address },
    items: cart.map(({ product, quantity, color, size, fulfillment_type }) => ({ fulfillment_type: confirmedPricing?.items?.find(item=>item.slug===product.slug && item.color===color && item.size===size)?.fulfillment_type ?? fulfillment_type, slug: product.slug, name: product.name, price: confirmedPricing.items.find(item => item.slug === product.slug && item.color === color && item.size === size)?.price ?? product.price, qty: quantity, image: product.images?.[0] || "", color, size })),
    shipping,
    coupon_id: coupon?.id ?? null,
    discount,
    total: confirmedPricing.total,
    payment_provider: customer.payment,
    payment_fee: safePaymentFee,
    paypal_order_id: paypalCapture?.orderId,
    paypal_capture_id: paypalCapture?.captureId,
    notes: customer.notes || null,
  };
  const storage = (await import("@react-native-async-storage/async-storage")).default;
  const storageKey = "lecomax_pending_order_request";
  const fingerprint = JSON.stringify({ customer: order.customer, payment: order.payment_provider,
    items: cart.map(({product,quantity,color,size})=>({slug:product.slug,quantity,color,size})) });
  let requestKey = idempotencyKey;
  const savedText = await storage.getItem(storageKey);
  try {
    const saved = JSON.parse(savedText || "null");
    if (saved?.fingerprint === fingerprint && typeof saved.key === "string") requestKey = saved.key;
  } catch { /* Ignore an invalid local record; save a new key before sending. */ }
  await storage.setItem(storageKey, JSON.stringify({ fingerprint, key: requestKey }));
  const result = await apiRequest<CreatedOrder>("/api/orders", {
    method: "POST",
    headers: {
      "Idempotency-Key": requestKey,
      "X-Lecomax-Client": "mobile_app",
    },
    body: JSON.stringify(order),
  });
  await storage.removeItem(storageKey).catch(() => undefined);
  return result;
}

export function getCheckoutQuote(
  cart: CartLine[],
  input: {
    city: string;
    email: string;
    couponId?: string;
    paymentProvider?: "cod" | "paypal";
  },
) {
  return apiRequest<CheckoutQuote>("/api/checkout/quote", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      items: cart.map((line) => ({
        slug: line.product.slug,
        quantity: line.quantity,
        price: line.product.price,
        color: line.color,
        size: line.size,
      })),
    }),
  });
}

export function getPaymentMethods(city: string, subtotal: number) {
  return apiRequest<PaymentMethod[]>(
    `/api/payment-methods?city=${encodeURIComponent(city)}&subtotal=${subtotal}`,
  );
}

export function createPayPalCheckout(amount: number, requestId: string) {
  return apiRequest<{ orderId: string; approveUrl: string }>(
    "/api/paypal/mobile/create",
    {
      method: "POST",
      headers: { "X-Lecomax-Client": "mobile_app" },
      body: JSON.stringify({ amount, requestId }),
    },
  );
}

export function capturePayPalCheckout(orderId: string) {
  return apiRequest<PayPalCapture>("/api/paypal/mobile/capture", {
    method: "POST",
    headers: { "X-Lecomax-Client": "mobile_app" },
    body: JSON.stringify({ orderId }),
  });
}

export function getShippingQuote(city: string, subtotal: number) {
  return apiRequest<ShippingQuote>(`/api/shipping/quote?city=${encodeURIComponent(city)}&subtotal=${subtotal}`);
}

export function getCustomerOrders() {
  return apiRequest<CustomerOrder[]>("/api/orders?limit=50", {
    authenticated: true,
  });
}

export function getOrderTracking(orderNumber: string, email: string) {
  const query = new URLSearchParams({
    order: orderNumber.trim(),
    email: email.trim().toLowerCase(),
  });
  return apiRequest<{ order: TrackingOrder }>(`/api/tracking?${query.toString()}`);
}
