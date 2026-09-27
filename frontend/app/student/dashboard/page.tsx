'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookMarked,
  CalendarClock,
  MessageSquare,
  Bell,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { subjectTint, subjectBn } from '@/lib/design/subjects';
import {
  cn,
  firstName,
  formatDate,
  formatDateLong,
  formatPercentage,
  formatTime,
  minutesFromMidnight,
} from '@/lib/utils';

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your dashboard');
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

  const schedule: any[] = useMemo(() => data?.todaySchedule ?? [], [data]);

  const { current, next } = useMemo(() => {
    if (nowMinutes === null) return { current: null, next: null };
    let cur: any = null;
    let nxt: any = null;
    for (const slot of schedule) {
      const s = minutesFromMidnight(slot.startTime);
      const e = minutesFromMidnight(slot.endTime);
      if (s === null || e === null) continue;
      if (nowMinutes >= s && nowMinutes < e) cur = slot;
      else if (nowMinutes < s && !nxt) nxt = slot;
    }
    return { current: cur, next: nxt };
  }, [schedule, nowMinutes]);

  const focus = current ?? next;
  const focusIsNow = Boolean(current);

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description="Your dashboard did not load." onRetry={load} />;

  const student = data?.student;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const pending: any[] = data?.pendingHomework ?? [];
  const attendancePct = data?.attendancePercentage;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}, ${firstName(student?.fullName) || 'there'}`}
        description={`${student?.classId?.name ?? ''} ${student?.classId?.section ?? ''} · ${formatDateLong(new Date())}`.trim()}
      />

      {/* The one bold element: the class they are in, or the one coming up. */}
      {focus && (
        <section
          className={cn(
            'rounded-card border p-5',
            focusIsNow ? 'border-highlighter bg-highlighter-wash' : 'border-line bg-surface'
          )}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="min-w-0 flex-1">
              <Badge tone={focusIsNow ? 'warning' : 'neutral'}>
                {focusIsNow ? 'Happening now' : 'Next class'}
              </Badge>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                {focus.teacherAssignmentId?.subjectId?.name ?? 'Class'}
              </h2>
              {subjectBn(focus.teacherAssignmentId?.subjectId) && (
                <p lang="bn" className="font-bn text-body text-ink-muted">
                  {subjectBn(focus.teacherAssignmentId?.subjectId)}
                </p>
              )}
            </div>

            <dl className="flex gap-x-8">
              <div>
                <dt className="text-meta text-ink-subtle">Time</dt>
                <dd className="mt-0.5 text-dense font-medium text-ink tabular">
                  {formatTime(focus.startTime)}
                </dd>
              </div>
              {focus.room && (
                <div>
                  <dt className="text-meta text-ink-subtle">Room</dt>
                  <dd className="mt-0.5 text-dense font-medium text-ink">{focus.room}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Section
          title="Due soon"
          actions={
            pending.length ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/homework">See all</Link>
              </Button>
            ) : undefined
          }
        >
          {!pending.length ? (
            <div className="rounded-card border border-line bg-surface shadow-card">
              <EmptyState
                icon={BookMarked}
                title="Nothing due"
                description="You have handed in everything that was set."
                compact
              />
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
              {pending.slice(0, 4).map((hw: any) => {
                const overdue = hw.dueAt && new Date(hw.dueAt) < new Date();
                return (
                  <li key={hw._id}>
                    <Link
                      href="/student/homework"
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-wash/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                    >
                      <span
                        className={cn('h-8 w-1 shrink-0 rounded-full', subjectTint(hw.subjectId))}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-dense font-medium text-ink">
                          {hw.title}
                        </span>
                        <SubjectLabel
                          subject={hw.subjectId}
                          className="text-meta text-ink-muted"
                          inline
                        />
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-meta text-ink-subtle">Due</span>
                        <span
                          className={cn(
                            'block text-meta tabular',
                            overdue ? 'font-medium text-danger' : 'text-ink'
                          )}
                        >
                          {formatDate(hw.dueAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Your attendance">
          <div className="rounded-card border border-line bg-surface shadow-card p-5">
            {attendancePct === undefined || attendancePct === null ? (
              <EmptyState
                icon={CheckSquare}
                title="No attendance recorded yet"
                description="It appears once your teachers start taking attendance."
                compact
              />
            ) : (
              <>
                <p className="text-3xl font-semibold text-ink tabular">
                  {formatPercentage(attendancePct)}
                </p>
                <Progress
                  value={attendancePct}
                  tone={attendancePct >= 90 ? 'success' : attendancePct >= 75 ? 'warning' : 'danger'}
                  className="mt-3"
                  label="Attendance"
                />
                <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2">
                  <Link href="/student/attendance">See your record</Link>
                </Button>
              </>
            )}
          </div>
        </Section>
      </div>

      <Section title="Today's classes">
        {!schedule.length ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState icon={CalendarClock} title="No classes today" compact />
          </div>
        ) : (
          <ol className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
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
                  {slot.room && (
                    <span className="shrink-0 text-meta text-ink-subtle">{slot.room}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* A plain section with a normal button — not a gradient banner. */}
        <Section
          title="Ask about your textbook"
          description="Stuck on something? Ask a question about what you are studying."
        >
          <div className="rounded-card border border-line bg-surface shadow-card p-5">
            <Button asChild>
              <Link href="/student/ai-learning">
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                Start a question
              </Link>
            </Button>
          </div>
        </Section>

        <Section
          title="From the school"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/notifications">All notifications</Link>
            </Button>
          }
        >
          {!data?.recentNotices?.length ? (
            <div className="rounded-card border border-line bg-surface shadow-card">
              <EmptyState icon={Bell} title="Nothing new" compact />
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
              {data.recentNotices.slice(0, 4).map((n: any) => (
                <li key={n._id} className="px-4 py-3">
                  <p className="text-dense font-medium text-ink">{n.title}</p>
                  {n.description && (
                    <p className="mt-0.5 line-clamp-2 text-meta text-ink-muted">{n.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-32 w-full rounded-card" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-card" />
        <Skeleton className="h-52 rounded-card" />
      </div>
    </div>
  );
}
