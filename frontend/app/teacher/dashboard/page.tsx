'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ClipboardCheck, UserCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subjectTint, subjectBn } from '@/lib/design/subjects';
import { cn, formatDateLong, formatTime, minutesFromMidnight } from '@/lib/utils';

export default function TeacherDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getTodaySchedule()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your day');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const schedule: any[] = useMemo(() => data?.schedule ?? [], [data]);

  /** The class happening now, or failing that the next one still to come. */
  const { current, next, minutesLeft } = useMemo(() => {
    if (nowMinutes === null) return { current: null, next: null, minutesLeft: null };
    let cur: any = null;
    let nxt: any = null;
    let left: number | null = null;

    for (const slot of schedule) {
      const s = minutesFromMidnight(slot.startTime);
      const e = minutesFromMidnight(slot.endTime);
      if (s === null || e === null) continue;
      if (nowMinutes >= s && nowMinutes < e) {
        cur = slot;
        left = e - nowMinutes;
      } else if (nowMinutes < s && !nxt) {
        nxt = slot;
      }
    }
    return { current: cur, next: nxt, minutesLeft: left };
  }, [schedule, nowMinutes]);

  const focus = current ?? next;
  const focusIsNow = Boolean(current);

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description="Your schedule did not load." onRetry={load} />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Today"
        description={formatDateLong(new Date())}
        actions={
          data?.pendingGrading > 0 ? (
            <Button variant="secondary" asChild>
              <Link href="/teacher/homework">
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />
                {data.pendingGrading} to grade
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* The one bold element on this page: the class in front of them. */}
      {focus ? (
        <section
          className={cn(
            'overflow-hidden rounded-card border',
            focusIsNow ? 'border-highlighter bg-highlighter-wash' : 'border-line bg-surface'
          )}
        >
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={focusIsNow ? 'warning' : 'neutral'}>
                  {focusIsNow ? 'In progress' : 'Next class'}
                </Badge>
                {focusIsNow && minutesLeft !== null && (
                  <span className="text-meta text-ink-muted tabular">
                    {minutesLeft} min left
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-2xl font-semibold text-ink">
                {focus.teacherAssignmentId?.subjectId?.name ?? 'Class'}
              </h2>
              {subjectBn(focus.teacherAssignmentId?.subjectId) && (
                <p lang="bn" className="font-bn text-body text-ink-muted">
                  {subjectBn(focus.teacherAssignmentId?.subjectId)}
                </p>
              )}

              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                <div>
                  <dt className="text-meta text-ink-subtle">Class</dt>
                  <dd className="mt-0.5 text-dense font-medium text-ink">
                    {focus.classId?.name} {focus.classId?.section}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-subtle">Time</dt>
                  <dd className="mt-0.5 text-dense font-medium text-ink tabular">
                    {formatTime(focus.startTime)} – {formatTime(focus.endTime)}
                  </dd>
                </div>
                {(focus.room || focus.classId?.room) && (
                  <div>
                    <dt className="text-meta text-ink-subtle">Room</dt>
                    <dd className="mt-0.5 text-dense font-medium text-ink">
                      {focus.room || focus.classId?.room}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <Button size="lg" asChild>
              <Link href="/teacher/attendance">
                <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                Take attendance
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={CalendarClock}
            title={schedule.length ? 'All your classes are done for today' : 'No classes today'}
            description={
              schedule.length
                ? 'Nothing else is scheduled. Marking and homework are still open.'
                : 'Your routine has nothing scheduled for today.'
            }
            action={
              <Button variant="secondary" asChild>
                <Link href="/teacher/schedule">See the week</Link>
              </Button>
            }
          />
        </div>
      )}

      <Section
        title="Today's classes"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/schedule">See the week</Link>
          </Button>
        }
      >
        {!schedule.length ? (
          <div className="rounded-card border border-line bg-surface">
            <EmptyState icon={CalendarClock} title="Nothing scheduled" compact />
          </div>
        ) : (
          <ol className="divide-y divide-line rounded-card border border-line bg-surface">
            {schedule.map((slot: any) => {
              const s = minutesFromMidnight(slot.startTime);
              const e = minutesFromMidnight(slot.endTime);
              const live =
                nowMinutes !== null && s !== null && e !== null && nowMinutes >= s && nowMinutes < e;
              const done = nowMinutes !== null && e !== null && nowMinutes >= e;

              return (
                <li
                  key={slot._id}
                  className={cn('flex items-center gap-4 px-4 py-3', live && 'bg-highlighter-wash')}
                >
                  <div className="w-20 shrink-0">
                    <p
                      className={cn(
                        'text-dense tabular',
                        done ? 'text-ink-subtle' : 'font-medium text-ink'
                      )}
                    >
                      {formatTime(slot.startTime)}
                    </p>
                    {live && <p className="text-meta font-medium text-warning">Now</p>}
                  </div>

                  <span
                    className={cn(
                      'h-8 w-1 shrink-0 rounded-full',
                      subjectTint(slot.teacherAssignmentId?.subjectId)
                    )}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <SubjectLabel
                      subject={slot.teacherAssignmentId?.subjectId}
                      className={cn('text-dense', done ? 'text-ink-muted' : 'font-medium text-ink')}
                    />
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-dense text-ink">
                      {slot.classId?.name} {slot.classId?.section}
                    </p>
                    {(slot.room || slot.classId?.room) && (
                      <p className="text-meta text-ink-subtle">{slot.room || slot.classId?.room}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      {data?.pendingGrading > 0 && (
        <Section title="Waiting on you">
          <Link
            href="/teacher/homework"
            className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-bg text-warning">
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-dense font-medium text-ink">
                  {data.pendingGrading}{' '}
                  {data.pendingGrading === 1 ? 'submission' : 'submissions'} to grade
                </span>
                <span className="block text-meta text-ink-muted">
                  Students are waiting on their marks.
                </span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
          </Link>
        </Section>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 w-full rounded-card" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
