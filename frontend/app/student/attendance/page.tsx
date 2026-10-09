'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatPercentage, formatTime } from '@/lib/utils';
import { StudyDiary } from '@/components/student/StudyDiary';
import { t } from '@/lib/i18n';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getAttendance()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load your attendance'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const records: any[] = useMemo(() => data?.attendance ?? [], [data]);


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full rounded-card" />
      </div>
    );
  }

  if (failed) return <ErrorState description={t('Your attendance did not load.')} onRetry={load} />;

  const summary = data?.summary ?? {};
  const hasRecords = records.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader title={t('Attendance')} />

      {hasRecords ? (
        <>
          <SummaryStrip
            figures={[
              { label: t('Classes attended'), value: summary.present ?? 0, detail: `of ${summary.total ?? 0}` },
              { label: t('Absent'), value: summary.absent ?? 0 },
              { label: t('On leave'), value: summary.leave ?? 0 },
              { label: t('Attendance'), value: formatPercentage(summary.percentage ?? 0) },
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
            label={t('Overall attendance')}
          />

          <StudyDiary />

          <Section title={t('Every class')}>
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
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
        <>
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={CheckSquare}
            title={t('No attendance recorded yet')}
            description={t('Your record appears here once your teachers start taking attendance.')}
          />
        </div>
        <StudyDiary />
        </>
      )}
    </div>
  );
}
