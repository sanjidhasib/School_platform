'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { GradeChart } from '@/components/shared/GradeChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Field } from '@/components/ui/field';
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { apiErrorMessage, formatDate, gradeTone } from '@/lib/utils';
import { subjectBn } from '@/lib/design/subjects';

export default function StudentResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('all');
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getResults()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your results');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const grades: any[] = useMemo(() => data?.grades ?? [], [data]);
  const marks: any[] = useMemo(() => data?.marks ?? [], [data]);

  const terms = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => g.term && set.add(g.term));
    return Array.from(set);
  }, [grades]);

  const visibleGrades = term === 'all' ? grades : grades.filter((g) => g.term === term);

  /** Was wired in the API layer but had no button anywhere in the old UI. */
  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await studentAPI.downloadReport();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report-card.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report card downloaded');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not download your report card'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (failed) return <ErrorState description="Your results did not load." onRetry={load} />;

  const hasAnything = grades.length > 0 || marks.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Results"
        actions={
          hasAnything ? (
            <Button variant="secondary" onClick={downloadReport} loading={downloading}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
              Download report card
            </Button>
          ) : undefined
        }
      />

      {!hasAnything ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={BarChart3}
            title="No results yet"
            description="Your grades appear here once your teachers publish them."
          />
        </div>
      ) : (
        <>
          {terms.length > 1 && (
            <Field label="Term" className="w-48">
              {(p) => (
                <Combobox
                  {...p}
                  options={[
                    { value: 'all', label: 'All terms' },
                    ...terms.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
                  ]}
                  value={term}
                  onChange={setTerm}
                />
              )}
            </Field>
          )}

          {/* Only when there's enough data for a chart to say more than the
              table already does — two bars would just be decoration. */}
          {visibleGrades.length >= 3 && (
            <Section title="Progress at a glance">
              <Panel>
                <GradeChart
                  data={visibleGrades.map((g: any) => ({
                    id: g._id,
                    subject: g.subjectId?.name ?? 'Subject',
                    subjectBn: subjectBn(g.subjectId),
                    percentage: g.percentage ?? 0,
                    grade: g.grade,
                  }))}
                />
              </Panel>
            </Section>
          )}

          <Section title="Subject grades">
            {!visibleGrades.length ? (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <EmptyState
                  icon={BarChart3}
                  title="No grades for this term"
                  description="Try another term."
                  compact
                />
              </div>
            ) : (
              <TableWrap>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Subject</TableHead>
                      <TableHead className="hidden sm:table-cell">Term</TableHead>
                      <TableHead numeric>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead numeric>GPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleGrades.map((g: any) => (
                      <TableRow key={g._id}>
                        <TableCell>
                          <SubjectLabel subject={g.subjectId} className="font-medium text-ink" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-ink-muted">
                          {g.term?.replace(/_/g, ' ')}
                        </TableCell>
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
                        <TableCell numeric className="font-medium text-ink">
                          {g.gradePoint?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            )}
          </Section>

          {marks.length > 0 && (
            <Section title="Test and exam marks">
              <TableWrap>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Assessment</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead numeric>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map((m: any) => (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium text-ink">
                          {m.assessmentId?.title ?? '—'}
                        </TableCell>
                        <TableCell>
                          <SubjectLabel subject={m.assessmentId?.subjectId} className="text-ink" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell tabular text-ink-muted">
                          {m.assessmentId?.assessmentDate
                            ? formatDate(m.assessmentId.assessmentDate)
                            : '—'}
                        </TableCell>
                        <TableCell numeric>
                          {m.absent ? (
                            <span className="text-danger">Absent</span>
                          ) : (
                            <span className="text-ink">
                              {m.obtainedMarks}
                              <span className="text-ink-subtle"> / {m.assessmentId?.maxMarks}</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
