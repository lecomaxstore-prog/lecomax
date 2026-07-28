export function couponStateAfterUse(
  usedCount: number,
  maxUses: number | null,
) {
  const currentUses = Number.isInteger(usedCount) && usedCount >= 0
    ? usedCount
    : 0;
  const normalizedMaximum =
    maxUses !== null && Number.isInteger(maxUses) && maxUses > 0
      ? maxUses
      : null;
  const nextUsedCount = currentUses + 1;

  return {
    usedCount: nextUsedCount,
    active: normalizedMaximum === null || nextUsedCount < normalizedMaximum,
  };
}
