import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const toDate = (date: string | Date) => (typeof date === 'string' ? parseISO(date) : date);

const isValid = (date: string | Date | null | undefined): date is string | Date => {
  if (!date) return false;
  const d = toDate(date as string | Date);
  return d instanceof Date && !Number.isNaN(d.getTime());
};

/** Bangladeshi convention: day first, month abbreviated, four-digit year. */
export function formatDate(date: string | Date) {
  if (!isValid(date)) return '—';
  return format(toDate(date), 'd MMM yyyy');
}

export function formatDateLong(date: string | Date) {
  if (!isValid(date)) return '—';
  return format(toDate(date), 'EEEE, d MMMM yyyy');
}

export function formatDayMonth(date: string | Date) {
  if (!isValid(date)) return '—';
  return format(toDate(date), 'd MMM');
}

export function formatDateTime(date: string | Date) {
  if (!isValid(date)) return '—';
  return format(toDate(date), 'd MMM yyyy, h:mm a');
}

export function formatRelativeTime(date: string | Date) {
  if (!isValid(date)) return '—';
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

/** "Today" / "Yesterday" / a date — used to group notification lists. */
export function formatDayGroup(date: string | Date) {
  if (!isValid(date)) return 'Earlier';
  const d = toDate(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDate(d);
}

/** "09:00" -> "9:00 am". Timetable times are plain HH:mm strings from the API. */
export function formatTime(hhmm?: string | null) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

/** Minutes since midnight, for positioning against the timetable grid. */
export function minutesFromMidnight(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatPercentage(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

export function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  // Bangladeshi names often lead with an honorific ("Md.", "Mst."), which makes
  // a poor initial, so skip it when there is a real name behind it.
  const meaningful = parts.filter((p) => !/^(md|mst|mrs|mr|ms|dr)\.?$/i.test(p));
  const source = meaningful.length ? meaningful : parts;
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return (source[0][0] + source[source.length - 1][0]).toUpperCase();
}

/** First name, for greetings. Skips the honorific for the same reason. */
export function firstName(name?: string | null) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter((p) => !/^(md|mst|mrs|mr|ms|dr)\.?$/i.test(p));
  return parts[0] || name.trim().split(/\s+/)[0] || '';
}

/**
 * Grade colour follows the school's own scale (A+ is 5.00 here, as on a real
 * Bangladeshi transcript) and reuses the shared status tones rather than
 * introducing a second colour vocabulary.
 */
export function gradeTone(grade?: string | null): string {
  if (!grade) return 'bg-surface-sunken text-ink-muted';
  const g = grade.toUpperCase();
  if (g === 'A+' || g === 'A') return 'bg-success-bg text-success';
  if (g === 'A-' || g === 'B') return 'bg-info-bg text-info';
  if (g === 'C' || g === 'D') return 'bg-warning-bg text-warning';
  return 'bg-danger-bg text-danger';
}

/** Pulls a readable message out of an axios error without leaking internals. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string; errors?: string[] } };
    message?: string;
  };
  const data = e?.response?.data;
  if (data?.errors?.length) return data.errors[0];
  return data?.error || data?.message || fallback;
}
