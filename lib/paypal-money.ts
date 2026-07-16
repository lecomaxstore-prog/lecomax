export const PAYPAL_CURRENCY = "USD" as const;
export const PAYPAL_MAD_PER_USD = 10;

export function paypalAmountFromMad(amountMad: number): string {
  if (!Number.isFinite(amountMad) || amountMad <= 0) throw new Error("Invalid MAD amount");
  return (amountMad / PAYPAL_MAD_PER_USD).toFixed(2);
}
