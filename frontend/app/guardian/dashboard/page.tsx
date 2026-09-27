'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookMarked, BarChart3, Download, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ChildSwitcher } from '@/components/shared/ChildSwitcher';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiErrorMessage, firstName, formatPercentage, gradeTone } from '@/lib/utils';
import { t } from '@/lib/i18n';

export default function GuardianDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    guardianAPI
      .getDashboard()
      .then((r) => {
        const payload = r.data.data;
        setData(payload);
        if (payload?.children?.length) setSelectedId(payload.children[0].student._id);
      })
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load your dashboard'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const downloadReport = async () => {
    if (!selectedId) return;
    setDownloading(true);
    try {
      const res = await guardianAPI.downloadChildReport(selectedId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'progress-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('Progress report downloaded'));
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not download the progress report')));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (failed) return <ErrorState description={t('Your dashboard did not load.')} onRetry={load} />;

  if (!data?.children?.length) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('Your children')} />
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Users}
            title={t('No children linked to your account')}
            description={t('Please ask the school office to link your child\'s record to your account.')}
          />
        </div>
      </div>
    );
  }

  const child = data.children.find((c: any) => c.student._id === selectedId) ?? data.children[0];
  const student = child.student;
  const attendance = child.attendancePercentage;

  return (
    <div className="space-y-7">
      <PageHeader
        title={t('{firstName}\'s progress', { firstName: firstName(student.fullName) })}
        actions={
          <Button variant="secondary" onClick={downloadReport} loading={downloading}>
            <Download className="h-4 w-4" strokeWidth={1.75} />
            {t('Download progress report')}
          </Button>
        }
      />

      <ChildSwitcher
        options={data.children.map((c: any) => c.student)}
        selectedId={student._id}
        onSelect={setSelectedId}
      />

      <dl className="flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-5">
        <div>
          <dt className="text-meta text-ink-subtle">{t('Class')}</dt>
          <dd className="mt-0.5 text-dense font-medium text-ink">
            {student.classId?.name} {student.classId?.section}
          </dd>
        </div>
        <div>
          <dt className="text-meta text-ink-subtle">{t('Student ID')}</dt>
          <dd className="mt-0.5 text-dense font-medium text-ink tabular">{student.studentId}</dd>
        </div>
        <div>
          <dt className="text-meta text-ink-subtle">{t('Status')}</dt>
          <dd className="mt-1">
            <StatusPill status={student.status} />
          </dd>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title={t('Attendance')}
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/guardian/attendance">{t('See the record')}</Link>
            </Button>
          }
        >
          <div className="rounded-card border border-line bg-surface shadow-card p-5">
            {child.totalSessions ? (
              <>
                <p className="text-3xl font-semibold text-ink tabular">
                  {formatPercentage(attendance)}
                </p>
                <p className="mt-1 text-dense text-ink-muted tabular">
                  {t('{presentCount} of {totalSessions} classes attended', { presentCount: child.presentCount, totalSessions: child.totalSessions })}
                </p>
                <Progress
                  value={attendance}
                  tone={attendance >= 90 ? 'success' : attendance >= 75 ? 'warning' : 'danger'}
                  className="mt-3"
                  label={t('Attendance')}
                />
              </>
            ) : (
              <EmptyState
                icon={CheckSquare}
                title={t('No attendance recorded yet')}
                description={t('It appears once teachers start taking attendance.')}
                compact
              />
            )}
          </div>
        </Section>

        <Section title={t('Homework')}>
          <div className="rounded-card border border-line bg-surface shadow-card p-5">
            {child.pendingHomework > 0 ? (
              <>
                <p className="text-3xl font-semibold text-ink tabular">{child.pendingHomework}</p>
                <p className="mt-1 text-dense text-ink-muted">
                  {child.pendingHomework === 1 ? t('piece') : t('pieces')}{' '}{t('of homework still to hand in')}
                </p>
              </>
            ) : (
              <EmptyState
                icon={BookMarked}
                title={t('Nothing outstanding')}
                description={t('{firstName} has handed in everything that was set.', { firstName: firstName(student.fullName) })}
                compact
              />
            )}
          </div>
        </Section>
      </div>

      <Section
        title={t('Subject grades')}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/guardian/results">{t('See all results')}</Link>
          </Button>
        }
      >
        {!child.grades?.length ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState
              icon={BarChart3}
              title={t('No grades published yet')}
              description={t('Grades appear here once teachers publish them.')}
              compact
            />
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
            {child.grades.slice(0, 6).map((g: any) => (
              <li key={g._id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <SubjectLabel subject={g.subjectId} className="text-dense text-ink" />
                </div>
                <span className="text-dense text-ink-muted tabular">
                  {g.percentage?.toFixed(1)}%
                </span>
                <span
                  className={`w-12 rounded-chip px-2 py-0.5 text-center text-meta font-semibold ${gradeTone(g.grade)}`}
                >
                  {g.grade}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-12 w-36 rounded-full" />
        ))}
      </div>
      <div className="flex gap-10 border-b border-line pb-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-44 rounded-card" />
      </div>
    </div>
  );
}
