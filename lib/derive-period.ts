export function derivePeriod(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  return { year, month, weekOfMonth };
}