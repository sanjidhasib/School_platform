'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Users } from 'lucide-react';
import { toast } from 'sonner';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ChildSwitcher } from '@/components/shared/ChildSwitcher';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Progress } from '@/components/ui/progress';
import { firstName, formatDate, formatPercentage, formatTime } from '@/lib/utils';
import { t } from '@/lib/i18n';

export default function GuardianAttendancePage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    guardianAPI
      .getChildren()
      .then((r) => {
        const list = r.data.data ?? [];
        setChildren(list);
        if (list.length) setSelectedId(list[0]._id);
      })
      .catch(() => toast.error(t('Could not load your children')))
      .finally(() => setLoadingChildren(false));
  }, []);

  const load = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    setFailed(false);
    guardianAPI
      .getChildAttendance(selectedId)
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load attendance'));
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(load, [load]);

  const child = children.find((c: any) => c._id === selectedId);
  const records: any[] = useMemo(() => data?.attendance ?? [], [data]);
  const summary = data?.summary ?? {};

  /** Recent absences, called out plainly rather than in a red panel. */
  const absences = useMemo(
    () => records.filter((r) => r.record?.status === 'ABSENT').slice(0, 5),
    [records]
  );

  if (loadingChildren) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-64 rounded-full" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('Attendance')} />
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

  return (
    <div className="space-y-6">
      <PageHeader title={t('Attendance')} />

      <ChildSwitcher
        options={children}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : failed ? (
        <ErrorState description={t('Attendance did not load.')} onRetry={load} />
      ) : !records.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={CheckSquare}
            title={t('No attendance recorded yet')}
            description={t('{firstName}\'s record appears once teachers start taking attendance.', { firstName: firstName(child?.fullName) })}
          />
        </div>
      ) : (
        <>
          <SummaryStrip
            figures={[
              {
                label: t('Classes attended'),
                value: summary.present ?? 0,
                detail: `of ${summary.total ?? 0}`,
              },
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
            label={t('Attendance')}
          />

          {absences.length > 0 && (
            <Section title={t('Recent absences')}>
              <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
                {absences.map(({ session }: any) => (
                  <li key={session._id} className="flex items-center gap-4 px-4 py-3">
                    <span className="w-24 shrink-0 text-dense text-ink tabular">
                      {formatDate(session.sessionDate)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <SubjectLabel subject={session.subjectId} className="text-dense text-ink" />
                    </div>
                    <StatusPill status="ABSENT" />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t('Every class')}>
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
              {records.map(({ session, record }: any) => (
                <li key={session._id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-24 shrink-0">
                    <p className="text-dense text-ink tabular">{formatDate(session.sessionDate)}</p>
                    <p className="text-meta text-ink-subtle tabular">
                      {formatTime(session.startTime)}
                    </p>
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
      )}
    </div>
  );
}
