'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate, gradeTone, termLabel } from '@/lib/utils';
import { t } from '@/lib/i18n';

/** The office view of assessments set and grades published across the school. */
export default function AdminResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
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
      .getResultsOverview({ classId: classFilter === 'all' ? undefined : classFilter })
      .then((r) => {
        setAssessments(r.data.data?.assessments ?? []);
        setGrades(r.data.data?.grades ?? []);
      })
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load results'));
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
      <PageHeader title={t('Results')} description={t('Assessments set and grades published.')} />

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

      {failed ? (
        <ErrorState description={t('Results did not load.')} onRetry={load} />
      ) : (
        <Tabs defaultValue="grades">
          <TabsList>
            <TabsTrigger value="grades" indicatorId="results-tabs">
              {t('Published grades')}
            </TabsTrigger>
            <TabsTrigger value="assessments" indicatorId="results-tabs">
              {t('Assessments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="pt-5">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : !grades.length ? (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <EmptyState
                  icon={BarChart3}
                  title={t('No grades published')}
                  description={t('Grades appear here once a teacher publishes them.')}
                />
              </div>
            ) : (
              <TableWrap>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t('Student')}</TableHead>
                      <TableHead>{t('Class')}</TableHead>
                      <TableHead>{t('Subject')}</TableHead>
                      <TableHead>{t('Term')}</TableHead>
                      <TableHead numeric>{t('Percentage')}</TableHead>
                      <TableHead>{t('Grade')}</TableHead>
                      <TableHead numeric className="hidden sm:table-cell">
                        {t('GPA')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((g: any) => (
                      <TableRow key={g._id}>
                        <TableCell className="font-medium text-ink">
                          {g.studentId?.fullName ?? '—'}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {g.classId?.name} {g.classId?.section}
                        </TableCell>
                        <TableCell>
                          <SubjectLabel subject={g.subjectId} className="text-ink" />
                        </TableCell>
                        <TableCell className="text-ink-muted">{termLabel(g.term)}</TableCell>
                        <TableCell numeric className="text-ink-muted">
                          {g.percentage?.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-chip px-2 py-0.5 text-meta font-semibold ${gradeTone(g.grade)}`}
                          >
                            {g.grade}
                          </span>
                        </TableCell>
                        <TableCell numeric className="hidden sm:table-cell text-ink-muted">
                          {g.gradePoint?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="pt-5">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : !assessments.length ? (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <EmptyState
                  icon={BarChart3}
                  title={t('No assessments set')}
                  description={t('Tests and exams appear here once a teacher creates them.')}
                />
              </div>
            ) : (
              <TableWrap>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t('Assessment')}</TableHead>
                      <TableHead>{t('Class')}</TableHead>
                      <TableHead>{t('Subject')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('Teacher')}</TableHead>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead numeric>{t('Out of')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((a: any) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium text-ink">{a.title}</TableCell>
                        <TableCell className="text-ink-muted">
                          {a.classId?.name} {a.classId?.section}
                        </TableCell>
                        <TableCell>
                          <SubjectLabel subject={a.subjectId} className="text-ink" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-ink-muted">
                          {a.teacherId?.fullName ?? '—'}
                        </TableCell>
                        <TableCell className="tabular text-ink-muted">
                          {formatDate(a.assessmentDate)}
                        </TableCell>
                        <TableCell numeric className="text-ink-muted">
                          {a.maxMarks}
                        </TableCell>
                        <TableCell>
                          <StatusPill status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
