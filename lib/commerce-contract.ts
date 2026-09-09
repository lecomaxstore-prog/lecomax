export type CartRequestItem = { slug: string; quantity: number; price?: number; color?: string; size?: string };
export type CartCalculation = {
  items: Array<CartRequestItem & { price: number; fulfillment_type: "STANDARD" | "PREORDER"; preorder_estimated_at: string | null; preorder_message: string | null }>;
  currency: string; subtotal: number; couponDiscount: number; loyaltyDiscount: number;
  discount: number; shipping: number; paymentFee: number; taxes: number; taxesIncluded: boolean;
  total: number; estimatedDays: string; zoneName: string; freeThreshold: number; priceChanged: boolean;
  settingsVersion: string;
};
