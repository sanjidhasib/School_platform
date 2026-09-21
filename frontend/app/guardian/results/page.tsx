'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ChildSwitcher } from '@/components/shared/ChildSwitcher';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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

export default function GuardianResultsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    guardianAPI
      .getChildren()
      .then((r) => {
        const list = r.data.data ?? [];
        setChildren(list);
        if (list.length) setSelectedId(list[0]._id);
      })
      .catch(() => toast.error('Could not load your children'))
      .finally(() => setLoadingChildren(false));
  }, []);

  const load = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    setFailed(false);
    guardianAPI
      .getChildResults(selectedId)
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load results');
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(load, [load]);

  const grades: any[] = useMemo(() => data?.grades ?? [], [data]);
  const marks: any[] = useMemo(() => data?.marks ?? [], [data]);

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
      toast.success('Progress report downloaded');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not download the progress report'));
    } finally {
      setDownloading(false);
    }
  };

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
        <PageHeader title="Results" />
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={Users}
            title="No children linked to your account"
            description="Please ask the school office to link your child's record to your account."
          />
        </div>
      </div>
    );
  }

  const hasAnything = grades.length > 0 || marks.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        actions={
          hasAnything ? (
            <Button variant="secondary" onClick={downloadReport} loading={downloading}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
              Download progress report
            </Button>
          ) : undefined
        }
      />

      <ChildSwitcher
        options={children}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {loading ? (
        <TableSkeleton cols={4} />
      ) : failed ? (
        <ErrorState description="Results did not load." onRetry={load} />
      ) : !hasAnything ? (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={BarChart3}
            title="No results published yet"
            description="Grades appear here once teachers publish them."
          />
        </div>
      ) : (
        <>
          {grades.length > 0 && (
            <Section title="Subject grades">
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
                    {grades.map((g: any) => (
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
            </Section>
          )}

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
