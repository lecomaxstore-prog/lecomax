export function parisLearningDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return { date: `${value("year")}-${value("month")}-${value("day")}`, hour: Number(value("hour")) };
}
