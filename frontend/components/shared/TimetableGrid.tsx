'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn, formatTime, minutesFromMidnight } from '@/lib/utils';
import { DAYS, SHORT_DAYS, PERIODS } from '@/lib/constants';
import { subjectTint, subjectBn } from '@/lib/design/subjects';

/**
 * The routine (রুটিন) as it hangs on a Bangladeshi school notice board: days
 * across, periods down, one subject and teacher to a cell. That grid is already
 * the mental model here, so the digital version keeps it rather than replacing
 * it with a generic Western calendar.
 *
 * The one thing paper cannot do is show which period is happening now, so that
 * is the single place `highlighter` is spent.
 */

export interface TimetableEntry {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  classId?: { _id?: string; name?: string; section?: string; room?: string } | string;
  teacherAssignmentId?: {
    _id?: string;
    subjectId?: { _id?: string; code?: string; name?: string; nameBn?: string };
    teacherId?: { _id?: string; fullName?: string } | string;
  };
}

export interface Period {
  label?: string;
  name?: string;
  start?: string;
  startTime?: string;
  end?: string;
  endTime?: string;
}

const normalisePeriod = (p: Period) => ({
  label: p.label ?? p.name ?? '',
  start: p.start ?? p.startTime ?? '',
  end: p.end ?? p.endTime ?? '',
});

function useNowMinutes() {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TimetableGrid({
  entries,
  days = [0, 1, 2, 3, 4],
  periods = PERIODS,
  onSelectSlot,
  onSelectEntry,
  /** What each block shows beneath the subject: the teacher, or the class. */
  secondary = 'teacher',
  className,
}: {
  entries: TimetableEntry[];
  days?: number[];
  periods?: Period[];
  onSelectSlot?: (day: number, period: { start: string; end: string }) => void;
  onSelectEntry?: (entry: TimetableEntry) => void;
  secondary?: 'teacher' | 'class';
  className?: string;
}) {
  const nowMinutes = useNowMinutes();
  const today = React.useMemo(() => new Date().getDay(), []);
  const rows = periods.map(normalisePeriod);

  const entryAt = (day: number, start: string) =>
    entries.find((e) => e.dayOfWeek === day && e.startTime === start);

  const isNow = (start: string, end: string) => {
    if (nowMinutes === null) return false;
    const s = minutesFromMidnight(start);
    const e = minutesFromMidnight(end);
    return s !== null && e !== null && nowMinutes >= s && nowMinutes < e;
  };

  return (
    <div className={cn('scrollbar-thin overflow-x-auto rounded-card border border-line bg-surface', className)}>
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          Class routine, {DAYS[days[0]]} to {DAYS[days[days.length - 1]]}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-24 px-3 py-2 text-left text-meta font-medium text-ink-subtle">
              Time
            </th>
            {days.map((d) => (
              <th
                key={d}
                scope="col"
                className={cn(
                  'px-3 py-2 text-left text-meta font-medium',
                  d === today ? 'text-ink' : 'text-ink-subtle'
                )}
              >
                <span className="hidden sm:inline">{DAYS[d]}</span>
                <span className="sm:hidden">{SHORT_DAYS[d]}</span>
                {d === today && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-highlighter align-middle" aria-label="Today" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const live = isNow(p.start, p.end);
            return (
              <tr key={p.start} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className="relative w-24 border-r border-line px-3 py-2 text-left align-top"
                >
                  <span className="block text-meta font-medium text-ink-muted tabular">
                    {formatTime(p.start)}
                  </span>
                  <span className="block text-[11px] text-ink-subtle">{p.label}</span>
                  {live && (
                    <span
                      className="absolute -right-1 top-2 h-2 w-2 rounded-full bg-highlighter ring-2 ring-surface"
                      aria-hidden="true"
                    />
                  )}
                </th>

                {days.map((d) => {
                  const entry = entryAt(d, p.start);
                  const subject = entry?.teacherAssignmentId?.subjectId;
                  const teacher =
                    typeof entry?.teacherAssignmentId?.teacherId === 'object'
                      ? entry?.teacherAssignmentId?.teacherId?.fullName
                      : undefined;
                  const cls = typeof entry?.classId === 'object' ? entry?.classId : undefined;
                  const nowCell = live && d === today;

                  return (
                    <td
                      key={d}
                      className={cn(
                        'border-r border-line p-1.5 align-top last:border-r-0',
                        nowCell && 'bg-highlighter-wash'
                      )}
                    >
                      {entry ? (
                        <BlockButton
                          onClick={onSelectEntry ? () => onSelectEntry(entry) : undefined}
                          tint={subjectTint(subject)}
                          nowCell={nowCell}
                        >
                          <span className="block truncate text-[12px] font-semibold text-ink">
                            {subject?.name ?? 'Subject'}
                          </span>
                          {subjectBn(subject) && (
                            <span
                              lang="bn"
                              className="block truncate font-bn text-[11px] leading-snug text-ink/70"
                            >
                              {subjectBn(subject)}
                            </span>
                          )}
                          <span className="mt-0.5 block truncate text-[11px] text-ink/65">
                            {secondary === 'teacher'
                              ? teacher ?? '—'
                              : cls
                                ? `${cls.name ?? ''} ${cls.section ?? ''}`.trim()
                                : '—'}
                          </span>
                          {(entry.room || cls?.room) && (
                            <span className="block truncate text-[11px] text-ink/55">
                              {entry.room || cls?.room}
                            </span>
                          )}
                        </BlockButton>
                      ) : onSelectSlot ? (
                        <button
                          type="button"
                          onClick={() => onSelectSlot(d, { start: p.start, end: p.end })}
                          aria-label={`Add a class on ${DAYS[d]} at ${formatTime(p.start)}`}
                          className="group flex h-full min-h-[4.25rem] w-full items-center justify-center rounded-chip border border-dashed border-line text-ink-subtle transition-colors hover:border-brand hover:bg-brand-wash hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          <Plus className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={1.75} />
                        </button>
                      ) : (
                        <div className="min-h-[4.25rem]" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BlockButton({
  children,
  onClick,
  tint,
  nowCell,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tint: string;
  nowCell?: boolean;
}) {
  const classes = cn(
    'block h-full min-h-[4.25rem] w-full rounded-chip p-2 text-left',
    tint,
    nowCell && 'ring-1 ring-highlighter',
    onClick &&
      'transition-shadow hover:ring-1 hover:ring-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
  );
  if (!onClick) return <div className={classes}>{children}</div>;
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

/** Phones get the day as a vertical list instead of a five-column grid. */
export function TimetableDayList({
  entries,
  day,
  periods = PERIODS,
  onSelectEntry,
  secondary = 'teacher',
}: {
  entries: TimetableEntry[];
  day: number;
  periods?: Period[];
  onSelectEntry?: (entry: TimetableEntry) => void;
  secondary?: 'teacher' | 'class';
}) {
  const nowMinutes = useNowMinutes();
  const today = new Date().getDay();
  const rows = periods.map(normalisePeriod);

  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {rows.map((p) => {
        const entry = entries.find((e) => e.dayOfWeek === day && e.startTime === p.start);
        const subject = entry?.teacherAssignmentId?.subjectId;
        const teacher =
          typeof entry?.teacherAssignmentId?.teacherId === 'object'
            ? entry?.teacherAssignmentId?.teacherId?.fullName
            : undefined;
        const cls = typeof entry?.classId === 'object' ? entry?.classId : undefined;
        const s = minutesFromMidnight(p.start);
        const e = minutesFromMidnight(p.end);
        const live =
          day === today && nowMinutes !== null && s !== null && e !== null && nowMinutes >= s && nowMinutes < e;

        return (
          <li key={p.start} className={cn('flex gap-3 p-3', live && 'bg-highlighter-wash')}>
            <div className="w-16 shrink-0">
              <p className="text-meta font-medium text-ink-muted tabular">{formatTime(p.start)}</p>
              {live && <p className="text-[11px] font-medium text-warning">Now</p>}
            </div>
            {entry ? (
              <button
                type="button"
                onClick={onSelectEntry ? () => onSelectEntry(entry) : undefined}
                disabled={!onSelectEntry}
                className={cn(
                  'min-w-0 flex-1 rounded-chip p-2 text-left',
                  subjectTint(subject),
                  onSelectEntry && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
                )}
              >
                <span className="block truncate text-dense font-semibold text-ink">
                  {subject?.name}
                </span>
                {subjectBn(subject) && (
                  <span lang="bn" className="block truncate font-bn text-meta text-ink/70">
                    {subjectBn(subject)}
                  </span>
                )}
                <span className="block truncate text-meta text-ink/65">
                  {secondary === 'teacher'
                    ? teacher ?? '—'
                    : cls
                      ? `${cls.name ?? ''} ${cls.section ?? ''}`.trim()
                      : '—'}
                  {entry.room ? ` · ${entry.room}` : ''}
                </span>
              </button>
            ) : (
              <p className="flex-1 self-center text-dense text-ink-subtle">Free period</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
