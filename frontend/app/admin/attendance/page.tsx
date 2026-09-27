'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { SummaryStrip } from '@/components/shared/SummaryStrip';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Progress } from '@/components/ui/progress';
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatTime, formatDateLong } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * The office view of attendance across the school for one day. Read-only:
 * marking attendance stays with the teacher who took the class.
 */
export default function AdminAttendancePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
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
      .getAttendanceOverview({
        date,
        classId: classFilter === 'all' ? undefined : classFilter,
      })
      .then((r) => setRows(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load attendance'));
      })
      .finally(() => setLoading(false));
  }, [date, classFilter]);

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

  const totals = rows.reduce(
    (acc, r) => {
      acc.present += r.counts?.PRESENT ?? 0;
      acc.absent += r.counts?.ABSENT ?? 0;
      acc.leave += r.counts?.LEAVE ?? 0;
      return acc;
    },
    { present: 0, absent: 0, leave: 0 }
  );
  const marked = totals.present + totals.absent + totals.leave;

  return (
    <div className="space-y-5">
      <PageHeader title={t('Attendance')} description={formatDateLong(date)} />

      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('Date')} className="w-44">
          {(p) => (
            <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </Field>
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
        <ErrorState description={t('Attendance did not load.')} onRetry={load} />
      ) : !rows.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={UserCheck}
            title={t('No attendance taken on this day')}
            description={t('Sessions appear here once a teacher opens a class and saves attendance.')}
          />
        </div>
      ) : (
        <>
          {/* Only shown when attendance has actually been recorded. */}
          {marked > 0 && (
            <SummaryStrip
              figures={[
                { label: t('Sessions'), value: rows.length },
                { label: t('Present'), value: totals.present, detail: `of ${marked}` },
                { label: t('Absent'), value: totals.absent },
                { label: t('On leave'), value: totals.leave },
              ]}
            />
          )}

          <TableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20">{t('Time')}</TableHead>
                  <TableHead>{t('Class')}</TableHead>
                  <TableHead>{t('Subject')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('Teacher')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="w-48">{t('Present')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ session, counts }: any) => {
                  const total = (counts.PRESENT ?? 0) + (counts.ABSENT ?? 0) + (counts.LEAVE ?? 0);
                  const pct = total ? (counts.PRESENT / total) * 100 : 0;
                  return (
                    <TableRow key={session._id}>
                      <TableCell className="tabular text-ink-muted">
                        {formatTime(session.startTime)}
                      </TableCell>
                      <TableCell className="font-medium text-ink">
                        {session.classId?.name} {session.classId?.section}
                      </TableCell>
                      <TableCell>
                        <SubjectLabel subject={session.subjectId} className="text-ink" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-ink-muted">
                        {session.teacherId?.fullName ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={session.status} />
                      </TableCell>
                      <TableCell>
                        {total ? (
                          <div className="space-y-1">
                            <p className="text-meta text-ink-muted tabular">
                              {t('{PRESENT} of {total}', { PRESENT: counts.PRESENT, total })}
                              {counts.ABSENT ? t(' · {ABSENT} absent', { ABSENT: counts.ABSENT }) : ''}
                              {counts.LEAVE ? t(' · {LEAVE} on leave', { LEAVE: counts.LEAVE }) : ''}
                            </p>
                            <Progress
                              value={pct}
                              tone={pct >= 90 ? 'success' : pct >= 75 ? 'warning' : 'danger'}
                              className="max-w-[10rem]"
                            />
                          </div>
                        ) : (
                          <span className="text-meta text-ink-subtle">{t('Not marked yet')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrap>
        </>
      )}
    </div>
  );
}
