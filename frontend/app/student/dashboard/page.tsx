'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  MessageSquare,
  Bell,
  CheckSquare,
  Clock,
  MapPin,
  PartyPopper,
  Check,
  ArrowRight,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PersonAvatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { subjectTint, subjectBn } from '@/lib/design/subjects';
import { HOMEWORK_TYPES } from '@/lib/design/homework';
import { cn, firstName, formatDateLong, formatPercentage, formatTime, minutesFromMidnight } from '@/lib/utils';
import { t as tr, getLanguage } from '@/lib/i18n';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

type Entry = {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject: any;
  teacher: { fullName: string } | null;
};

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [routine, setRoutine] = useState<{ days: number[]; entries: Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([studentAPI.getDashboard(), studentAPI.getTimetable()])
      .then(([d, t]) => {
        setData(d.data.data);
        setRoutine(t.data.data);
      })
      .catch(() => {
        setFailed(true);
        toast.error(tr('Could not load your dashboard'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // The clock drives "Now" / "Next" on today's routine.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().getDay();
  const byDay = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of routine?.entries ?? []) {
      if (!map.has(e.dayOfWeek)) map.set(e.dayOfWeek, []);
      map.get(e.dayOfWeek)!.push(e);
    }
    return map;
  }, [routine]);

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description={tr('Your dashboard did not load.')} onRetry={load} />;

  const student = data?.student;
  const hour = new Date().getHours();
  const greeting = tr(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  const days = routine?.days?.length ? routine.days : Array.from(byDay.keys()).sort();
  const todayEntries = byDay.get(today) ?? [];
  const attendancePct = data?.attendancePercentage;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting}, ${firstName(student?.fullName) || 'there'}`}
        description={`${student?.classId?.name ?? ''} ${student?.classId?.section ?? ''} · ${formatDateLong(new Date())}`.trim()}
      />

      {/* ── The whole week ── */}
      <Section title={tr('Weekly routine')} description={tr('Every class this week, with the teacher who takes it.')}>
        {!days.length ? (
          <Empty icon={CalendarClock} title={tr('No routine yet')} text={tr('Your class routine appears here once the school publishes it.')} />
        ) : (
          <div className="space-y-3">
            {days.map((day) => (
              <DayRow key={day} day={day} entries={byDay.get(day) ?? []} isToday={day === today} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Today, period by period ── */}
      <Section
        title={tr('Today\'s routine')}
        description={tr(todayEntries.length === 1 ? '{day} · {n} class' : '{day} · {n} classes', { day: tr(DAY_NAMES[today]), n: todayEntries.length })}
      >
        {!todayEntries.length ? (
          <Empty icon={Sun} title={tr('No classes today')} text={tr('Enjoy your day off — your routine picks up on the next school day.')} />
        ) : (
          <ol className="space-y-3">
            {todayEntries.map((e, i) => (
              <TodayCard key={e._id} entry={e} index={i} nowMinutes={nowMinutes} entries={todayEntries} />
            ))}
          </ol>
        )}
      </Section>

      {/* ── What's due next school day ── */}
      <NextDayWork work={data?.nextDayWork ?? []} nextDay={data?.nextSchoolDay} />

      <div className="grid gap-8 lg:grid-cols-3">
        <Section title={tr('Your attendance')}>
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            {!data?.totalSessions ? (
              <EmptyState icon={CheckSquare} title={tr('No attendance recorded yet')} compact />
            ) : (
              <>
                <p className="text-3xl font-semibold text-ink tabular">{formatPercentage(attendancePct)}</p>
                <Progress
                  value={attendancePct}
                  tone={attendancePct >= 90 ? 'success' : attendancePct >= 75 ? 'warning' : 'danger'}
                  className="mt-3"
                  label={tr('Attendance')}
                />
                <Button variant="ghost" size="sm" asChild className="-ml-2 mt-3">
                  <Link href="/student/attendance">{tr('See your record')}</Link>
                </Button>
              </>
            )}
          </div>
        </Section>

        <Section title={tr('Stuck on something?')}>
          <div className="rounded-card border border-line bg-surface p-5 shadow-card">
            <p className="text-dense text-ink-muted">{tr('Ask the AI study helper about your textbook, in Bangla or English.')}</p>
            <Button asChild className="mt-4">
              <Link href="/student/ai-learning">
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                {tr('Ask a question')}
              </Link>
            </Button>
          </div>
        </Section>

        <Section
          title={tr('From the school')}
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/notifications">{tr('All')}</Link>
            </Button>
          }
        >
          {!data?.recentNotices?.length ? (
            <div className="rounded-card border border-line bg-surface shadow-card">
              <EmptyState icon={Bell} title={tr('Nothing new')} compact />
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
              {data.recentNotices.slice(0, 3).map((n: any) => (
                <li key={n._id} className="px-4 py-3">
                  <p className="text-dense font-medium text-ink">{n.title}</p>
                  {n.description && <p className="mt-0.5 line-clamp-2 text-meta text-ink-muted">{n.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Weekly routine: one long card per day ──────────────────────────────────

function DayRow({ day, entries, isToday }: { day: number; entries: Entry[]; isToday: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[18px] border bg-surface shadow-card md:flex-row',
        isToday ? 'border-brand/40 ring-1 ring-brand/25' : 'border-line'
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 px-4 py-3 md:w-36 md:flex-col md:items-start md:justify-center md:py-4',
          isToday ? 'bg-brand text-brand-contrast' : 'bg-surface-sunken'
        )}
      >
        <div>
          <p className={cn('text-dense font-semibold', !isToday && 'text-ink')}>{tr(DAY_NAMES[day])}</p>
          {getLanguage() !== 'bn' && (
            <p lang="bn" className={cn('font-bn text-meta', isToday ? 'opacity-85' : 'text-ink-muted')}>
              {DAY_BN[day]}
            </p>
          )}
        </div>
        {isToday ? (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-meta font-semibold">{tr('Today')}</span>
        ) : (
          <span className="text-meta text-ink-subtle tabular md:mt-1">
            {entries.length} {entries.length === 1 ? tr('class') : tr('classes')}
          </span>
        )}
      </div>

      {!entries.length ? (
        <p className="flex-1 px-4 py-4 text-dense text-ink-subtle">{tr('No classes.')}</p>
      ) : (
        // Scrolls sideways on narrow screens; a clean row on wide ones.
        <ol className="scrollbar-thin flex flex-1 gap-2.5 overflow-x-auto p-3">
          {entries.map((e) => (
            <li
              key={e._id}
              className="w-44 shrink-0 rounded-xl border border-line bg-paper p-3 md:w-auto md:min-w-[9.5rem] md:flex-1"
            >
              <p className="flex items-center gap-1 text-meta text-ink-subtle tabular">
                <Clock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                {formatTime(e.startTime)} – {formatTime(e.endTime)}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <span className={cn('mt-0.5 h-8 w-1 shrink-0 rounded-full', subjectTint(e.subject))} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-dense font-semibold text-ink">{e.subject?.name ?? tr('Class')}</p>
                  <p className="truncate text-meta text-ink-muted">{e.teacher?.fullName ?? tr('Teacher to be assigned')}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Today's routine: long cards with live state ────────────────────────────

function TodayCard({
  entry: e,
  entries,
  index,
  nowMinutes,
}: {
  entry: Entry;
  entries: Entry[];
  index: number;
  nowMinutes: number | null;
}) {
  const s = minutesFromMidnight(e.startTime);
  const end = minutesFromMidnight(e.endTime);
  const live = nowMinutes !== null && s !== null && end !== null && nowMinutes >= s && nowMinutes < end;
  const done = nowMinutes !== null && end !== null && nowMinutes >= end;
  // "Next" is the first class that hasn't started, when none is running.
  const firstUpcoming = entries.findIndex((x) => {
    const xs = minutesFromMidnight(x.startTime);
    return nowMinutes !== null && xs !== null && xs > nowMinutes;
  });
  const anyLive = entries.some((x) => {
    const xs = minutesFromMidnight(x.startTime);
    const xe = minutesFromMidnight(x.endTime);
    return nowMinutes !== null && xs !== null && xe !== null && nowMinutes >= xs && nowMinutes < xe;
  });
  const isNext = !anyLive && index === firstUpcoming;
  const bn = subjectBn(e.subject);

  return (
    <li
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-[18px] border bg-surface p-4 shadow-card transition-colors sm:flex-row sm:items-center sm:gap-6 sm:p-5',
        live ? 'border-highlighter bg-highlighter-wash' : isNext ? 'border-brand/40' : 'border-line',
        done && 'opacity-60'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1.5', subjectTint(e.subject))} aria-hidden="true" />

      <div className="flex items-center gap-3 pl-2 sm:w-44 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1">
        <span className="text-meta font-semibold uppercase tracking-wide text-ink-subtle">{tr('Period {value}', { value: index + 1 })}</span>
        <span className="text-lg font-bold text-ink tabular">{formatTime(e.startTime)}</span>
        <span className="text-meta text-ink-subtle tabular">{tr('to {formatTime}', { formatTime: formatTime(e.endTime) })}</span>
      </div>

      <div className="min-w-0 flex-1 pl-2 sm:pl-0">
        <p className="text-lg font-semibold text-ink">{e.subject?.name ?? tr('Class')}</p>
        {bn && (
          <p lang="bn" className="font-bn text-dense text-ink-muted">
            {bn}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pl-2 sm:w-56 sm:shrink-0 sm:pl-0">
        <PersonAvatar name={e.teacher?.fullName} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="text-meta text-ink-subtle">{tr('Teacher')}</p>
          <p className="truncate text-dense font-medium text-ink">{e.teacher?.fullName ?? tr('To be assigned')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pl-2 sm:w-32 sm:shrink-0 sm:flex-col sm:items-end sm:pl-0">
        {e.room ? (
          <span className="inline-flex items-center gap-1 text-meta text-ink-muted">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {e.room}
          </span>
        ) : (
          <span />
        )}
        {live ? (
          <span className="rounded-full bg-highlighter px-2.5 py-0.5 text-meta font-semibold text-[#1B2240]">{tr('Now')}</span>
        ) : isNext ? (
          <span className="rounded-full bg-brand-wash px-2.5 py-0.5 text-meta font-semibold text-brand">{tr('Next')}</span>
        ) : done ? (
          <span className="inline-flex items-center gap-1 text-meta text-ink-subtle">
            <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {tr('Done')}
          </span>
        ) : null}
      </div>
    </li>
  );
}

// ── Work due by the next school day ─────────────────────────────────────────

function NextDayWork({ work, nextDay }: { work: any[]; nextDay?: string }) {
  const date = nextDay ? new Date(nextDay) : null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date ? date.toDateString() === tomorrow.toDateString() : true;
  const dayLabel = isTomorrow ? tr('tomorrow') : tr('on {day}', { day: tr(DAY_NAMES[date!.getDay()]) });

  return (
    <Section
      title={isTomorrow ? tr('For tomorrow') : tr('For {value}', { value: tr(DAY_NAMES[date!.getDay()]) })}
      description={tr('Assignments, homework and what to prepare before your next classes.')}
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/homework">
            {tr('All homework')}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </Button>
      }
    >
      {!work.length ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-line bg-surface px-6 py-12 text-center shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <PartyPopper className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-lg font-semibold text-ink">{tr('No homework {dayLabel}', { dayLabel })}</p>
          <p className="text-body text-ink-muted">{tr('Have a good day!')}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {HOMEWORK_TYPES.map((t) => {
            const items = work.filter((w) => (w.type ?? 'HOMEWORK') === t.value);
            return (
              <div key={t.value} className="flex flex-col rounded-[18px] border border-line bg-surface shadow-card">
                <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t.tone)}>
                    <t.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-dense font-semibold text-ink">{tr(t.plural)}</p>
                    {getLanguage() !== 'bn' && (
                      <p lang="bn" className="font-bn text-meta text-ink-muted">
                        {t.labelBn}
                      </p>
                    )}
                  </div>
                  <span className="text-meta font-medium text-ink-subtle tabular">{items.length}</span>
                </div>
                {!items.length ? (
                  <p className="px-4 py-6 text-center text-dense text-ink-subtle">{tr('Nothing {dayLabel}.', { dayLabel })}</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((w) => {
                      const handedIn = ['SUBMITTED', 'LATE', 'GRADED'].includes(w.submission?.status);
                      return (
                        <li key={w._id}>
                          <Link
                            href="/student/homework"
                            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-wash/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                          >
                            <span className={cn('mt-1 h-8 w-1 shrink-0 rounded-full', subjectTint(w.subjectId))} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-dense font-medium text-ink">{w.title}</span>
                              <span className="block truncate text-meta text-ink-muted">
                                {w.subjectId?.name}
                                {w.teacherId?.fullName ? ` · ${w.teacherId.fullName}` : ''}
                              </span>
                            </span>
                            {handedIn ? (
                              <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-meta font-medium text-success">
                                {tr('Done')}
                              </span>
                            ) : (
                              <span className="shrink-0 text-meta text-ink-subtle tabular">
                                {new Date(w.dueAt).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function Empty({ icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface shadow-card">
      <EmptyState icon={icon} title={title} description={text} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
