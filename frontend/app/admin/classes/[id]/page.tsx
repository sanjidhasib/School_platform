'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, CalendarDays, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { TimetableGrid } from '@/components/shared/TimetableGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CapacityBar } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Panel } from '@/components/ui/card';

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [capacity, setCapacity] = useState(40);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setFailed(false);
    Promise.all([
      adminAPI.getClasses(),
      adminAPI.getClassStudents(id),
      adminAPI.getAssignments({ classId: id }),
      adminAPI.getTimetable({ classId: id }),
    ])
      .then(([clsRes, studentsRes, assignRes, ttRes]) => {
        setCls((clsRes.data.data ?? []).find((c: any) => c._id === id) ?? null);
        setStudents(studentsRes.data.data ?? []);
        setCapacity(studentsRes.data.capacity ?? 40);
        setAssignments((assignRes.data.data ?? []).filter((a: any) => a.classId?._id === id));
        setTimetable(ttRes.data.data ?? []);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Could not load this class');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (loading) return <DetailSkeleton />;
  if (failed || !cls) return <ErrorState description="This class did not load." onRetry={load} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/classes">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          All classes
        </Link>
      </Button>

      <PageHeader
        title={`${cls.name} ${cls.section ?? ''}`.trim()}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/admin/timetable">
              <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
              Edit routine
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line pb-5">
        <div>
          <p className="text-meta text-ink-subtle">Room</p>
          <p className="mt-0.5 text-dense text-ink">{cls.room || '—'}</p>
        </div>
        <div>
          <p className="text-meta text-ink-subtle">Subjects taught</p>
          <p className="mt-0.5 text-dense text-ink tabular">{assignments.length}</p>
        </div>
        <div className="min-w-[12rem]">
          <p className="mb-1 text-meta text-ink-subtle">Enrolment</p>
          <CapacityBar enrolled={students.length} capacity={capacity} />
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students" indicatorId="class-tabs">
            Students
          </TabsTrigger>
          <TabsTrigger value="subjects" indicatorId="class-tabs">
            Subjects and teachers
          </TabsTrigger>
          <TabsTrigger value="routine" indicatorId="class-tabs">
            Routine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="pt-5">
          <Panel title={`${students.length} students`}>
            {!students.length ? (
              <EmptyState
                icon={GraduationCap}
                title="No students in this class"
                description="Admit a student and assign them to this class."
                compact
                action={
                  <Button size="sm" asChild>
                    <Link href="/admin/students">Admit a student</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {students.map((s: any, i: number) => (
                  <li key={s._id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-6 shrink-0 text-meta text-ink-subtle tabular">{i + 1}</span>
                    <PersonAvatar name={s.fullName} src={s.photoUrl} className="h-8 w-8" />
                    <Link
                      href={`/admin/students/${s._id}`}
                      className="min-w-0 flex-1 truncate text-dense font-medium text-ink hover:text-brand hover:underline"
                    >
                      {s.fullName}
                    </Link>
                    <span className="shrink-0 text-dense text-ink-muted tabular">{s.studentId}</span>
                    <StatusPill status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="subjects" className="pt-5">
          <Panel title="Subjects and teachers">
            {!assignments.length ? (
              <EmptyState
                icon={ClipboardList}
                title="No teachers assigned"
                description="Assign a teacher to each subject this class studies."
                compact
                action={
                  <Button size="sm" asChild>
                    <Link href="/admin/assignments">Assign a teacher</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {assignments.map((a: any) => (
                  <li key={a._id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <SubjectLabel subject={a.subjectId} className="text-dense text-ink" />
                    </div>
                    <span className="truncate text-dense text-ink-muted">
                      {a.teacherId?.fullName ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="routine" className="pt-5">
          <TimetableGrid entries={timetable} secondary="teacher" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-10 border-b border-line pb-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}
