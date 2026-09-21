'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChildSwitcher } from '@/components/shared/ChildSwitcher';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSchool } from '@/lib/school-context';
import { apiErrorMessage, firstName } from '@/lib/utils';

export default function GuardianReportsPage() {
  const school = useSchool();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
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
      .finally(() => setLoading(false));
  }, []);

  const download = async () => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-64 rounded-full" />
        <Skeleton className="h-72 w-full max-w-lg rounded-card" />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="space-y-5">
        <PageHeader title="Reports" />
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

  const child = children.find((c: any) => c._id === selectedId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="The official progress report, as the school issues it."
      />

      <ChildSwitcher
        options={children}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* A preview shaped like the printed report, not a generic download box. */}
      <div className="max-w-lg overflow-hidden rounded-card border border-line bg-surface">
        <div className="border-b border-line px-6 py-5 text-center">
          <p className="text-section text-ink">{school.name}</p>
          {school.address && <p className="mt-0.5 text-meta text-ink-subtle">{school.address}</p>}
          <p className="mt-3 inline-block border-y border-line px-4 py-1 text-dense font-medium uppercase tracking-wide text-ink-muted">
            Progress report
          </p>
        </div>

        <dl className="divide-y divide-line">
          <div className="flex justify-between gap-4 px-6 py-3">
            <dt className="text-dense text-ink-subtle">Student</dt>
            <dd className="text-dense font-medium text-ink">{child?.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4 px-6 py-3">
            <dt className="text-dense text-ink-subtle">Student ID</dt>
            <dd className="text-dense font-medium text-ink tabular">{child?.studentId}</dd>
          </div>
          <div className="flex justify-between gap-4 px-6 py-3">
            <dt className="text-dense text-ink-subtle">Class</dt>
            <dd className="text-dense font-medium text-ink">
              {child?.classId?.name} {child?.classId?.section}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 border-t border-line px-6 py-4">
          <FileText className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
          <p className="flex-1 text-meta text-ink-muted">
            Attendance, subject grades and marks for {firstName(child?.fullName)}.
          </p>
          <Button onClick={download} loading={downloading}>
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
