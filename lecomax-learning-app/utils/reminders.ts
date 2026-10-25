export function reminderDates(minutes: number, now = new Date()): Date[] {
  if (![0, 10, 30, 60, 1440].includes(minutes)) throw new Error('INVALID_REMINDER');
  if (!minutes) return [];
  const dates: Date[] = [];
  const counts = new Map<string, number>();
  for (let offset = minutes; dates.length < 14 && offset <= 14 * 24 * 60; offset += minutes) {
    const date = new Date(now.getTime() + offset * 60000);
    if (minutes === 1440) {
      // Use calendar days so daylight-saving transitions cannot duplicate a day.
      date.setTime(now.getTime());
      date.setDate(now.getDate() + offset / 1440);
      date.setHours(10, 0, 0, 0);
    }
    if (date.getHours() < 9 || date.getHours() >= 20) continue;
    const key = date.toDateString();
    if ((counts.get(key) || 0) >= 3) continue;
    dates.push(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return dates;
}
