import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date) { return format(new Date(date), 'dd MMM yyyy'); }
export function formatDateTime(date: string | Date) { return format(new Date(date), 'dd MMM yyyy, hh:mm a'); }
export function formatRelativeTime(date: string | Date) { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
export function formatPercentage(value: number) { return `${Math.round(value)}%`; }
export function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
export function getGradeColor(grade: string) {
  if (grade === 'A+') return 'text-green-600 bg-green-50';
  if (grade === 'A') return 'text-blue-600 bg-blue-50';
  if (grade === 'A-') return 'text-cyan-600 bg-cyan-50';
  if (grade === 'B') return 'text-yellow-600 bg-yellow-50';
  if (grade === 'C') return 'text-orange-600 bg-orange-50';
  if (grade === 'D') return 'text-red-500 bg-red-50';
  return 'text-red-700 bg-red-100';
}
