'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, CheckSquare, BarChart3, Users } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Panel } from '@/components/ui/card';
import { formatDate, gradeTone } from '@/lib/utils';

/**
 * A student's record, gathered from the endpoints that serve the admin office.
 * Attendance and homework are not shown here because the API exposes those only
 * per signed-in student or per teacher session, not per student to an admin.
 */
export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setFailed(false);
    adminAPI
      .getStudent(id)
      .then((r) => setStudent(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load this student');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  // Subject grades come from the school-wide results view, filtered to this student.
  useEffect(() => {
    if (!student?.classId?._id) return;
    adminAPI
      .getResultsOverview({ classId: student.classId._id })
      .then((r) => {
        const grades = (r.data.data?.grades ?? []).filter(
          (g: any) => String(g.studentId?._id ?? g.studentId) === String(student._id)
        );
        setResults(grades);
      })
      .catch(() => setResults([]));
  }, [student]);

  if (loading) return <ProfileSkeleton />;
  if (failed || !student)
    return <ErrorState description="This student record did not load." onRetry={load} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/students">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          All students
        </Link>
      </Button>

      <div className="flex flex-wrap items-start gap-4">
        <PersonAvatar name={student.fullName} src={student.photoUrl} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <PageHeader title={student.fullName} />
          <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            <Fact label="Student ID" value={student.studentId} mono />
            <Fact
              label="Class"
              value={
                student.classId
                  ? `${student.classId.name} ${student.classId.section ?? ''}`.trim()
                  : '—'
              }
            />
            {student.classId?.room && <Fact label="Room" value={student.classId.room} />}
            <div>
              <dt className="text-meta text-ink-subtle">Status</dt>
              <dd className="mt-0.5">
                <StatusPill status={student.status} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" indicatorId="student-tabs">
            Details
          </TabsTrigger>
          <TabsTrigger value="guardians" indicatorId="student-tabs">
            Guardians
          </TabsTrigger>
          <TabsTrigger value="results" indicatorId="student-tabs">
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-5">
          <Panel title="Record">
            <dl className="grid gap-x-8 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label="Full name" value={student.fullName} />
              <Fact label="Student ID" value={student.studentId} mono />
              <Fact label="Roll number" value={student.rollNumber || '—'} />
              <Fact label="Date of birth" value={student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'} />
              <Fact label="Gender" value={student.gender || '—'} />
              <Fact label="Blood group" value={student.bloodGroup || '—'} />
              <Fact label="Phone" value={student.phone || '—'} />
              <Fact label="Email" value={student.userId?.email || student.email || '—'} />
              <Fact label="Username" value={student.userId?.username || '—'} mono />
              <Fact label="Admitted" value={student.admissionDate ? formatDate(student.admissionDate) : '—'} />
              <Fact label="Address" value={student.address || '—'} />
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="guardians" className="pt-5">
          <Panel title="Linked guardians">
            {!student.guardianIds?.length ? (
              <EmptyState
                icon={Users}
                title="No guardian linked"
                description="This student has no guardian account attached to their record."
                compact
              />
            ) : (
              <ul className="divide-y divide-line">
                {student.guardianIds.map((g: any) => (
                  <li key={g._id} className="flex items-center gap-3 px-4 py-3">
                    <PersonAvatar name={g.fullName} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-dense font-medium text-ink">{g.fullName}</p>
                      {g.relation && <p className="text-meta text-ink-subtle">{g.relation}</p>}
                    </div>
                    <div className="text-right">
                      {g.phone && <p className="text-dense text-ink-muted tabular">{g.phone}</p>}
                      {g.email && <p className="text-meta text-ink-subtle">{g.email}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="results" className="pt-5">
          <Panel title="Subject grades">
            {!results.length ? (
              <EmptyState
                icon={BarChart3}
                title="No grades published"
                description="Grades appear here once a teacher publishes them for this class."
                compact
              />
            ) : (
              <ul className="divide-y divide-line">
                {results.map((g: any) => (
                  <li key={g._id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <SubjectLabel subject={g.subjectId} className="text-dense text-ink" />
                    </div>
                    <span className="w-20 text-right text-dense text-ink-muted tabular">
                      {g.term}
                    </span>
                    <span className="w-16 text-right text-dense text-ink-muted tabular">
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
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-ink-subtle">{label}</dt>
      <dd className={`mt-0.5 truncate text-dense text-ink ${mono ? 'tabular' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}
