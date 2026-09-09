import { minorUnits } from "./money.ts";
export function calculateCheckoutTotal(input: {
  subtotal: number;
  shipping: number;
  paymentFee?: number;
  discount?: number;
  taxes?: number;
}) {
  const values = [
    input.subtotal,
    input.shipping,
    input.paymentFee ?? 0,
    input.discount ?? 0,
    input.taxes ?? 0,
  ];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("CHECKOUT_TOTAL_INPUT_INVALID");
  }
  return Math.max(
    0,
    minorUnits(input.subtotal) + minorUnits(input.shipping) +
      minorUnits(input.paymentFee ?? 0) + minorUnits(input.taxes ?? 0) - minorUnits(input.discount ?? 0),
  ) / 100;
}
