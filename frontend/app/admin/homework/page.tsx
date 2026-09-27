'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { t } from '@/lib/i18n';

/** The office view of homework set across the school. Read-only. */
export default function AdminHomeworkPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    adminAPI.getClasses().then((r) => setClasses(r.data.data ?? [])).catch(() => setClasses([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getHomeworkOverview({ classId: classFilter === 'all' ? undefined : classFilter })
      .then((r) => setRows(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load homework'));
      })
      .finally(() => setLoading(false));
  }, [classFilter]);

  useEffect(load, [load]);

  const classOptions = useMemo(
    () => [
      { value: 'all', label: t('All classes') },
      ...classes.map((c: any) => ({
        value: c._id,
        label: `${c.name} ${c.section ?? ''}`.trim(),
      })),
    ],
    [classes]
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t('Homework')} description={t('Everything set across the school, newest due first.')} />

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('Class')} className="w-48">
          {(p) => (
            <Combobox
              {...p}
              options={classOptions}
              value={classFilter}
              onChange={setClassFilter}
              placeholder={t('All classes')}
              searchPlaceholder={t('Find a class')}
            />
          )}
        </Field>
      </div>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : failed ? (
        <ErrorState description={t('The homework list did not load.')} onRetry={load} />
      ) : !rows.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={ClipboardCheck}
            title={t('No homework set')}
            description={t('Homework appears here once a teacher publishes it.')}
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Class')}</TableHead>
                <TableHead>{t('Subject')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('Teacher')}</TableHead>
                <TableHead>{t('Due')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('Turned in')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ homework, submissionCounts }: any) => {
                const turnedIn =
                  (submissionCounts.SUBMITTED ?? 0) +
                  (submissionCounts.LATE ?? 0) +
                  (submissionCounts.GRADED ?? 0);
                const total = turnedIn + (submissionCounts.NOT_SUBMITTED ?? 0);
                const overdue =
                  homework.dueAt && new Date(homework.dueAt) < new Date() && homework.status === 'PUBLISHED';

                return (
                  <TableRow key={homework._id}>
                    <TableCell className="font-medium text-ink">{homework.title}</TableCell>
                    <TableCell className="text-ink-muted">
                      {homework.classId?.name} {homework.classId?.section}
                    </TableCell>
                    <TableCell>
                      <SubjectLabel subject={homework.subjectId} className="text-ink" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-ink-muted">
                      {homework.teacherId?.fullName ?? '—'}
                    </TableCell>
                    <TableCell className="tabular text-ink-muted">
                      {formatDate(homework.dueAt)}
                      {overdue && <span className="ml-1.5 text-meta text-danger">{t('Past due')}</span>}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={homework.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular text-ink-muted">
                      {total ? t('{turnedIn} of {total}', { turnedIn, total }) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
