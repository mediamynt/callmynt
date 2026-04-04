export function addBusinessDays(input: Date, days: number) {
  const date = new Date(input);
  let remaining = days;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) {
      remaining -= 1;
    }
  }

  return date;
}

export function nextBusinessMorning(hour = 9) {
  const now = new Date();
  const next = addBusinessDays(now, now.getHours() >= hour ? 1 : 0);
  next.setHours(hour, 0, 0, 0);
  if (next.getDay() === 0) {
    next.setDate(next.getDate() + 1);
  }
  if (next.getDay() === 6) {
    next.setDate(next.getDate() + 2);
  }
  return next;
}

export function formatDuration(seconds?: number | null) {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
