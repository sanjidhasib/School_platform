'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Progress } from '@/components/ui/progress';
import { statusMeta } from '@/lib/design/status';
import { cn, formatDate, formatPercentage, formatTime } from '@/lib/utils';

const SHORT_DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const load = () => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getAttendance()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your attendance');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const records: any[] = useMemo(() => data?.attendance ?? [], [data]);

  /**
   * A day can hold several sessions. The worst status of the day is what shows
   * on the calendar, so an absence is never hidden behind a present mark.
   */
  const byDay = useMemo(() => {
    const map = new Map<string, { status: string; entries: any[] }>();
    const rank: Record<string, number> = { PRESENT: 0, LEAVE: 1, ABSENT: 2 };

    records.forEach((r) => {
      const date = r.session?.sessionDate;
      if (!date) return;
      const key = new Date(date).toDateString();
      const status = r.record?.status;
      if (!status) return;
      const existing = map.get(key);
      if (!existing) map.set(key, { status, entries: [r] });
      else {
        existing.entries.push(r);
        if ((rank[status] ?? 0) > (rank[existing.status] ?? 0)) existing.status = status;
      }
    });
    return map;
  }, [records]);

  const monthGrid = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const leading = first.getDay();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const monthLabel = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const today = new Date().toDateString();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full rounded-card" />
      </div>
    );
  }

  if (failed) return <ErrorState description="Your attendance did not load." onRetry={load} />;

  const summary = data?.summary ?? {};
  const hasRecords = records.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader title="Attendance" />

      {hasRecords ? (
        <>
          <SummaryStrip
            figures={[
              { label: 'Classes attended', value: summary.present ?? 0, detail: `of ${summary.total ?? 0}` },
              { label: 'Absent', value: summary.absent ?? 0 },
              { label: 'On leave', value: summary.leave ?? 0 },
              { label: 'Attendance', value: formatPercentage(summary.percentage ?? 0) },
            ]}
          />

          <Progress
            value={summary.percentage ?? 0}
            tone={
              (summary.percentage ?? 0) >= 90
                ? 'success'
                : (summary.percentage ?? 0) >= 75
                  ? 'warning'
                  : 'danger'
            }
            className="max-w-md"
            label="Overall attendance"
          />

          <Section
            title={monthLabel}
            actions={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            }
          >
            <div className="rounded-card border border-line bg-surface p-3">
              <div className="grid grid-cols-7 gap-1">
                {SHORT_DAY_INITIALS.map((d, i) => (
                  <div key={i} className="pb-1 text-center text-meta text-ink-subtle">
                    <abbr title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]} className="no-underline">
                      {d}
                    </abbr>
                  </div>
                ))}

                {monthGrid.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const key = date.toDateString();
                  const day = byDay.get(key);
                  const meta = day ? statusMeta(day.status) : null;
                  const Icon = meta?.icon;
                  const isToday = key === today;

                  const tone = day
                    ? {
                        success: 'bg-success-bg text-success',
                        danger: 'bg-danger-bg text-danger',
                        warning: 'bg-warning-bg text-warning',
                        info: 'bg-info-bg text-info',
                        neutral: 'bg-surface-sunken text-ink-muted',
                      }[meta!.tone]
                    : 'text-ink-subtle';

                  return (
                    <div
                      key={key}
                      title={day ? `${formatDate(date)} — ${meta?.label}` : formatDate(date)}
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-chip text-meta',
                        tone,
                        isToday && 'ring-2 ring-highlighter'
                      )}
                    >
                      <span className="font-medium tabular">{date.getDate()}</span>
                      {Icon && <Icon className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />}
                      {day && <span className="sr-only">{meta?.label}</span>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3">
                <StatusPill status="PRESENT" />
                <StatusPill status="ABSENT" />
                <StatusPill status="LEAVE" />
              </div>
            </div>
          </Section>

          <Section title="Every class">
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {records.map(({ session, record }: any) => (
                <li key={session._id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-24 shrink-0">
                    <p className="text-dense text-ink tabular">{formatDate(session.sessionDate)}</p>
                    <p className="text-meta text-ink-subtle tabular">{formatTime(session.startTime)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <SubjectLabel subject={session.subjectId} className="text-dense text-ink" />
                  </div>
                  <StatusPill status={record?.status ?? 'NOT_SUBMITTED'} />
                </li>
              ))}
            </ul>
          </Section>
        </>
      ) : (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={CheckSquare}
            title="No attendance recorded yet"
            description="Your record appears here once your teachers start taking attendance."
          />
        </div>
      )}
    </div>
  );
}
