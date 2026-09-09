export const STORE_CURRENCY = "MAD";
export function minorUnits(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 100) throw new Error("INVALID_MONEY");
  return Math.round((value + Number.EPSILON) * 100);
}
export const roundMoney = (value: number) => minorUnits(value) / 100;
export function formatMoney(value: number, currency = STORE_CURRENCY, locale = "fr-MA") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}
