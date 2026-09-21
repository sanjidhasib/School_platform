import { cn } from '@/lib/utils';
const statusMap: Record<string, { label: string; className: string }> = {
  PRESENT:       { label: 'Present',       className: 'bg-green-100 text-green-700' },
  ABSENT:        { label: 'Absent',        className: 'bg-red-100 text-red-700' },
  LEAVE:         { label: 'Leave',         className: 'bg-yellow-100 text-yellow-700' },
  SUBMITTED:     { label: 'Submitted',     className: 'bg-blue-100 text-blue-700' },
  NOT_SUBMITTED: { label: 'Pending',       className: 'bg-slate-100 text-slate-600' },
  LATE:          { label: 'Late',          className: 'bg-orange-100 text-orange-700' },
  GRADED:        { label: 'Graded',        className: 'bg-purple-100 text-purple-700' },
  ACTIVE:        { label: 'Active',        className: 'bg-green-100 text-green-700' },
  INACTIVE:      { label: 'Inactive',      className: 'bg-slate-100 text-slate-500' },
  PUBLISHED:     { label: 'Published',     className: 'bg-blue-100 text-blue-700' },
  DRAFT:         { label: 'Draft',         className: 'bg-slate-100 text-slate-600' },
  LOCKED:        { label: 'Locked',        className: 'bg-red-100 text-red-700' },
  OPEN:          { label: 'Open',          className: 'bg-green-100 text-green-700' },
  CLOSED:        { label: 'Closed',        className: 'bg-slate-100 text-slate-600' },
  FINAL:         { label: 'Final',         className: 'bg-indigo-100 text-indigo-700' },
  GRADUATED:     { label: 'Graduated',     className: 'bg-teal-100 text-teal-700' },
  TRANSFERRED:   { label: 'Transferred',   className: 'bg-amber-100 text-amber-700' },
};
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>{config.label}</span>;
}
