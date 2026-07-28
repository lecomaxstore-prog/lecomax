import { apiRequest } from "@/lib/api-client";
import type { AppliedCoupon } from "@/services/coupons";
import type { CartLine } from "@/types/commerce";

export type CheckoutPayload = { name: string; email: string; phone: string; city: string; address: string; notes?: string; payment: "cod" | "paypal" };
export type ShippingQuote = { cost: number; estimatedDays?: string; zoneName?: string };
type CreatedOrder = { order_number: string; id: string; duplicate?: boolean };
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
export type CheckoutQuote = {
  currency: "MAD";
  subtotal: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  discount: number;
  shipping: number;
  paymentFee: number;
  taxes: number;
  taxesIncluded: boolean;
  total: number;
  estimatedDays: string;
  zoneName: string;
  priceChanged: boolean;
};
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
  if (!cart.length) throw new Error("Le panier est vide.");
  const localSubtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const subtotal = confirmedPricing?.subtotal ?? localSubtotal;
  const quote = confirmedQuote ?? await getShippingQuote(customer.city, subtotal);
  const shipping = (confirmedPricing?.shipping ?? Number(quote.cost)) || 0;
  const discount =
    confirmedPricing?.discount ??
    (coupon?.discount ?? 0) + Math.max(0, additionalDiscount);
  const safePaymentFee = confirmedPricing?.paymentFee ?? paymentFee;
  const order = {
    customer: { name: customer.name, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address },
    items: cart.map(({ product, quantity, color, size }) => ({ slug: product.slug, name: product.name, price: product.price, qty: quantity, image: product.images?.[0] || "", color, size })),
    shipping,
    coupon_id: coupon?.id ?? null,
    discount,
    total:
      confirmedPricing?.total ??
      Math.max(0, subtotal + shipping + safePaymentFee - discount),
    payment_provider: customer.payment,
    payment_fee: safePaymentFee,
    paypal_order_id: paypalCapture?.orderId,
    paypal_capture_id: paypalCapture?.captureId,
    notes: customer.notes || null,
  };
  return apiRequest<CreatedOrder>("/api/orders", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
      "X-Lecomax-Client": "mobile_app",
    },
    body: JSON.stringify(order),
  });
}

export function getCheckoutQuote(
  cart: CartLine[],
  input: {
    city: string;
    email: string;
    couponId?: string;
    paymentProvider: "cod" | "paypal";
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
