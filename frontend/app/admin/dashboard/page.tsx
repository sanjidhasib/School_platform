'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Bell, Plus, UserPlus, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import type { ClassEnrollment } from '@/components/shared/EnrollmentChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/card';
import { subjectTint } from '@/lib/design/subjects';
import { cn, formatDateLong, formatTime, formatDate, minutesFromMidnight } from '@/lib/utils';
import { t } from '@/lib/i18n';

// The chart library (recharts) is large; it loads only on the pages that draw a chart.
const EnrollmentChart = dynamic(() => import('@/components/shared/EnrollmentChart').then((m) => m.EnrollmentChart), {
  ssr: false,
  loading: () => <div className="skeleton w-full" style={{ height: 260 }} />,
});


export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<ClassEnrollment[] | null>(null);
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
        toast.error(t('Could not load the dashboard'));
      })
      .finally(() => setLoading(false));

    // Real enrolment figures for the chart — a second, small fetch rather
    // than growing the dashboard endpoint's payload for every consumer.
    adminAPI
      .getClasses()
      .then((r) =>
        setClasses(
          (r.data.data ?? [])
            .slice()
            .sort((a: any, b: any) => (a.gradeNumber ?? 0) - (b.gradeNumber ?? 0))
            .map((c: any) => ({
              id: c._id,
              label: `${c.name} ${c.section ?? ''}`.trim(),
              enrolled: c.enrollmentCount ?? 0,
              capacity: c.capacity ?? 40,
            }))
        )
      )
      .catch(() => setClasses([]));
  };

  useEffect(load, []);

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description={t('The school overview did not load.')} onRetry={load} />;

  const timetable: any[] = data?.todayTimetable ?? [];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const figures = [
    { label: t('Students'), value: data?.totalStudents ?? 0 },
    { label: t('Teachers'), value: data?.totalTeachers ?? 0 },
    { label: t('Classes'), value: data?.activeClasses ?? 0 },
    { label: t('Classes today'), value: data?.todaySessionsCount ?? 0 },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title={t('Dashboard')}
        description={formatDateLong(new Date())}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/admin/students">
                <UserPlus className="h-4 w-4" strokeWidth={1.75} />
                {t('Admit a student')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/timetable">
                <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                {t('Edit routine')}
              </Link>
            </Button>
          </>
        }
      />

      <SummaryStrip figures={figures} />

      {/* Today's routine is the main block, not a row of stat cards. */}
      <Section
        title={t('Today\'s routine')}
        description={timetable.length ? t('{length} classes scheduled', { length: timetable.length }) : undefined}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/timetable">{t('Open routine')}</Link>
          </Button>
        }
      >
        {!timetable.length ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState
              icon={CalendarClock}
              title={t('No classes scheduled today')}
              description={t('Add entries to the routine and they will appear here.')}
              action={
                <Button asChild>
                  <Link href="/admin/timetable">
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                    {t('Add to the routine')}
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <RoutineBoard entries={timetable} nowMinutes={nowMinutes} />
        )}
      </Section>

      {classes && classes.length > 0 && (
        <Section title={t('Class enrolment')} description={t('Against the school\'s 40-seat cap.')}>
          <Panel>
            <EnrollmentChart data={classes} />
          </Panel>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t('Notices')}>
          {!data?.recentNotices?.length ? (
            <EmptyState
              icon={Bell}
              title={t('No notices yet')}
              description={t('Publish one so it reaches the school.')}
              compact
              action={
                <Button size="sm" asChild>
                  <Link href="/admin/notices">{t('Write a notice')}</Link>
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

        <Panel title={t('Quick actions')}>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <QuickLink href="/admin/students" label={t('Admit a student')} />
            <QuickLink href="/admin/teachers" label={t('Add a teacher')} />
            <QuickLink href="/admin/classes" label={t('Assign a teacher')} />
            <QuickLink href="/admin/notices" label={t('Publish a notice')} />
            <QuickLink href="/admin/attendance" label={t('Review attendance')} />
            <QuickLink href="/admin/results" label={t('Review results')} />
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
        <div className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
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

/**
 * Today's routine as a board: one column per class, periods top to bottom,
 * so the office sees at a glance what every class is doing right now.
 */
function RoutineBoard({ entries, nowMinutes }: { entries: any[]; nowMinutes: number }) {
  const columns = new Map<string, { cls: any; items: any[] }>();
  for (const e of entries) {
    const key = e.classId?._id ?? 'none';
    if (!columns.has(key)) columns.set(key, { cls: e.classId, items: [] });
    columns.get(key)!.items.push(e);
  }
  const cols = Array.from(columns.values()).sort(
    (a, b) => (a.cls?.gradeNumber ?? 0) - (b.cls?.gradeNumber ?? 0) || String(a.cls?.section).localeCompare(String(b.cls?.section))
  );
  cols.forEach((c) => c.items.sort((x, y) => String(x.startTime).localeCompare(String(y.startTime))));

  return (
    <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-2">
      <div className="grid auto-cols-[minmax(11.5rem,1fr)] grid-flow-col gap-3">
        {cols.map(({ cls, items }) => (
          <div key={cls?._id ?? 'none'} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
            <div className="border-b border-line bg-surface-sunken px-3 py-2.5">
              <Link href={cls?._id ? `/admin/classes/${cls._id}` : '#'} className="text-dense font-semibold text-ink hover:text-brand">
                {cls?.name} {cls?.section}
              </Link>
              <p className="text-meta text-ink-subtle">
                {items.length} {items.length === 1 ? t('period') : t('periods')}
                {cls?.room ? ` · ${cls.room}` : ''}
              </p>
            </div>
            <ol className="flex-1 space-y-2 p-2">
              {items.map((e) => {
                const start = minutesFromMidnight(e.startTime);
                const end = minutesFromMidnight(e.endTime);
                const live = start !== null && end !== null && nowMinutes >= start && nowMinutes < end;
                const done = end !== null && nowMinutes >= end;
                const subject = e.teacherAssignmentId?.subjectId;
                return (
                  <li
                    key={e._id}
                    className={cn(
                      'relative overflow-hidden rounded-xl border py-2 pl-3.5 pr-2.5',
                      live ? 'border-highlighter bg-highlighter-wash' : 'border-line bg-paper',
                      done && !live && 'opacity-55'
                    )}
                  >
                    <span className={cn('absolute inset-y-0 left-0 w-1', subjectTint(subject))} aria-hidden="true" />
                    <p className="flex items-center justify-between gap-2 text-meta text-ink-subtle tabular">
                      {formatTime(e.startTime)}
                      {live && <span className="rounded-full bg-highlighter px-1.5 text-[10px] font-bold text-[#1B2240]">{t('NOW')}</span>}
                    </p>
                    <p className="truncate text-dense font-semibold text-ink">{subject?.name ?? t('Class')}</p>
                    <p className="truncate text-meta text-ink-muted">{e.teacherAssignmentId?.teacherId?.fullName ?? '—'}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
