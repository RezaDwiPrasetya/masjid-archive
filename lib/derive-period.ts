export function derivePeriod(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const weekOfMonth = Math.ceil(date.getUTCDate() / 7);
  return { year, month, weekOfMonth };
}