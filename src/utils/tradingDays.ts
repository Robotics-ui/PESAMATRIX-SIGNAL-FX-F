export function addTradingDays(from: Date, days: number): Date {
  let count = 0;
  const date = new Date(from);
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const d = date.getDay();
    if (d !== 0 && d !== 6) count++;
  }
  return date;
}

export function countRemainingTradingDays(expiryISO: string): number {
  const now = new Date();
  const expiry = new Date(expiryISO);
  if (expiry <= now) return 0;
  let count = 0;
  const date = new Date(now);
  while (date < expiry) {
    date.setDate(date.getDate() + 1);
    const d = date.getDay();
    if (d !== 0 && d !== 6 && date <= expiry) count++;
  }
  return count;
}

export function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function nextTradingDay(from: Date): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + 1);
  while (isWeekend(date)) date.setDate(date.getDate() + 1);
  return date;
}
