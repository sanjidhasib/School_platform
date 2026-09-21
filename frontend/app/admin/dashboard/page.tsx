'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Bell, Plus, UserPlus, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/card';
import { subjectTint } from '@/lib/design/subjects';
import { cn, formatDateLong, formatTime, formatDate, minutesFromMidnight } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load the dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description="The school overview did not load." onRetry={load} />;

  const timetable: any[] = data?.todayTimetable ?? [];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const figures = [
    { label: 'Students', value: data?.totalStudents ?? 0 },
    { label: 'Teachers', value: data?.totalTeachers ?? 0 },
    { label: 'Classes', value: data?.activeClasses ?? 0 },
    { label: 'Classes today', value: data?.todaySessionsCount ?? 0 },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description={formatDateLong(new Date())}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/admin/students">
                <UserPlus className="h-4 w-4" strokeWidth={1.75} />
                Admit a student
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/timetable">
                <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                Edit routine
              </Link>
            </Button>
          </>
        }
      />

      <SummaryStrip figures={figures} />

      {/* Today's routine is the main block, not a row of stat cards. */}
      <Section
        title="Today's routine"
        description={timetable.length ? `${timetable.length} classes scheduled` : undefined}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/timetable">Open routine</Link>
          </Button>
        }
      >
        {!timetable.length ? (
          <div className="rounded-card border border-line bg-surface">
            <EmptyState
              icon={CalendarClock}
              title="No classes scheduled today"
              description="Add entries to the routine and they will appear here."
              action={
                <Button asChild>
                  <Link href="/admin/timetable">
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                    Add to the routine
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {timetable.map((entry: any) => {
              const start = minutesFromMidnight(entry.startTime);
              const end = minutesFromMidnight(entry.endTime);
              const live = start !== null && end !== null && nowMinutes >= start && nowMinutes < end;
              const subject = entry.teacherAssignmentId?.subjectId;

              return (
                <li
                  key={entry._id}
                  className={cn('flex items-center gap-4 px-4 py-3', live && 'bg-highlighter-wash')}
                >
                  <div className="w-20 shrink-0">
                    <p className="text-dense font-medium text-ink tabular">
                      {formatTime(entry.startTime)}
                    </p>
                    {live && <p className="text-meta font-medium text-warning">Now</p>}
                  </div>

                  <span
                    className={cn('h-8 w-1 shrink-0 rounded-full', subjectTint(subject))}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <SubjectLabel subject={subject} className="text-dense font-medium text-ink" />
                  </div>

                  <div className="hidden w-40 shrink-0 sm:block">
                    <p className="truncate text-dense text-ink-muted">
                      {entry.teacherAssignmentId?.teacherId?.fullName ?? '—'}
                    </p>
                  </div>

                  <div className="w-28 shrink-0 text-right">
                    <p className="truncate text-dense text-ink">
                      {entry.classId?.name} {entry.classId?.section}
                    </p>
                    {entry.room && <p className="truncate text-meta text-ink-subtle">{entry.room}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Notices">
          {!data?.recentNotices?.length ? (
            <EmptyState
              icon={Bell}
              title="No notices yet"
              description="Publish one so it reaches the school."
              compact
              action={
                <Button size="sm" asChild>
                  <Link href="/admin/notices">Write a notice</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {data.recentNotices.slice(0, 5).map((n: any) => (
                <li key={n._id} className="px-4 py-3">
                  <p className="text-dense font-medium text-ink">{n.title}</p>
                  {n.description && (
                    <p className="mt-0.5 line-clamp-2 text-meta text-ink-muted">{n.description}</p>
                  )}
                  <p className="mt-1 text-meta text-ink-subtle">
                    {formatDate(n.eventDate || n.publishAt || n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <QuickLink href="/admin/students" label="Admit a student" />
            <QuickLink href="/admin/teachers" label="Add a teacher" />
            <QuickLink href="/admin/assignments" label="Assign a teacher" />
            <QuickLink href="/admin/notices" label="Publish a notice" />
            <QuickLink href="/admin/attendance" label="Review attendance" />
            <QuickLink href="/admin/results" label="Review results" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-btn border border-line px-3 py-2 text-dense font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {label}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-10 border-b border-line pb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
