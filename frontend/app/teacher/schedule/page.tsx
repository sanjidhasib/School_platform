'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { TimetableGrid, TimetableDayList } from '@/components/shared/TimetableGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { DAYS, SHORT_DAYS } from '@/lib/constants';
import { cn, formatDateLong } from '@/lib/utils';

const SCHOOL_DAYS = [0, 1, 2, 3, 4];

/** The teacher's own routine: which class they are in, when, and where. */
export default function TeacherSchedulePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [day, setDay] = useState(() => {
    const today = new Date().getDay();
    return SCHOOL_DAYS.includes(today) ? today : 0;
  });

  const load = () => {
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getWeekSchedule()
      .then((r) => setEntries(r.data.data?.schedule ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your routine');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (failed) return <ErrorState description="Your routine did not load." onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Schedule"
        description={view === 'day' ? formatDateLong(new Date()) : 'Sunday to Thursday'}
        actions={
          <div className="flex rounded-btn border border-line p-0.5">
            <button
              type="button"
              onClick={() => setView('day')}
              aria-pressed={view === 'day'}
              className={cn(
                'h-8 rounded-chip px-3 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                view === 'day' ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
              )}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              aria-pressed={view === 'week'}
              className={cn(
                'h-8 rounded-chip px-3 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                view === 'week' ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
              )}
            >
              Week
            </button>
          </div>
        }
      />

      {!entries.length ? (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={CalendarDays}
            title="Nothing on your routine"
            description="Once the office adds you to the school routine, your classes appear here."
          />
        </div>
      ) : view === 'week' ? (
        <>
          <div className="hidden sm:block">
            <TimetableGrid entries={entries} days={SCHOOL_DAYS} secondary="class" />
          </div>
          <div className="space-y-3 sm:hidden">
            <DayTabs day={day} onChange={setDay} />
            <TimetableDayList entries={entries} day={day} secondary="class" />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <DayTabs day={day} onChange={setDay} />
          <TimetableDayList entries={entries} day={day} secondary="class" />
        </div>
      )}
    </div>
  );
}

function DayTabs({ day, onChange }: { day: number; onChange: (d: number) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Day"
      className="flex gap-1 overflow-x-auto rounded-btn border border-line p-0.5"
    >
      {SCHOOL_DAYS.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={day === d}
          onClick={() => onChange(d)}
          className={cn(
            'min-h-[2.25rem] flex-1 rounded-chip px-2 text-meta font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            day === d ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
          )}
        >
          <span className="hidden sm:inline">{DAYS[d]}</span>
          <span className="sm:hidden">{SHORT_DAYS[d]}</span>
        </button>
      ))}
    </div>
  );
}
