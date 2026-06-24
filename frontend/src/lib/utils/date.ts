const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function getDayOfWeekName(date: Date): string {
  const dayIndex = date.getDay();
  return dayNames[dayIndex];
}

export function formatDateLabel(date: Date | null): string {
  if (!date) return '';
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const dayName = getDayOfWeekName(date);
  const dd = date.getDate().toString().padStart(2, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${hh}:${mm} ${dayName}, ${dd}/${mo}`;
}

export function formatDateFull(date: Date | null): string {
  if (!date) return '';
  const dd = date.getDate().toString().padStart(2, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mo}/${yyyy}`;
}
