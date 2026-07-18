export const LOYALTY_POINTS_DIVISOR = 10;

export const LOYALTY_TIERS = [
  { name: "Gold", min: 2000, next: null, nextLabel: null, discountPercent: 50 },
  { name: "Silver", min: 500, next: 2000, nextLabel: "Gold", discountPercent: 30 },
  { name: "Bronze", min: 0, next: 500, nextLabel: "Silver", discountPercent: 0 },
] as const;

export function loyaltyPointsForAmount(amount: number) {
  return Math.max(0, Math.floor(amount / LOYALTY_POINTS_DIVISOR));
}

export function loyaltyTierForPoints(points: number) {
  const safePoints = Math.max(0, Math.floor(points));
  const tier = LOYALTY_TIERS.find((candidate) => safePoints >= candidate.min) ?? LOYALTY_TIERS[LOYALTY_TIERS.length - 1];
  const progress = tier.next === null
    ? 100
    : Math.min(100, Math.max(0, Math.round(((safePoints - tier.min) / (tier.next - tier.min)) * 100)));
  return {
    ...tier,
    progress,
    remaining: tier.next === null ? 0 : Math.max(0, tier.next - safePoints),
  };
}
