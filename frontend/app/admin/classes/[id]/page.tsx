'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, CalendarDays, Send, CheckCircle2, Clock, BookOpen, X, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { TimetableGrid } from '@/components/shared/TimetableGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { CapacityBar } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Panel } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { apiErrorMessage, cn, termLabel } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';
import { t as tr } from '@/lib/i18n';

const fmtDay = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA');

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [overview, setOverview] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [capacity, setCapacity] = useState(40);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  const [reqOpen, setReqOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [req, setReq] = useState({
    subjectIds: [] as string[],
    grades: true,
    attendance: true,
    term: 'TERM_1',
    upTo: '',
    dueDate: inDays(7),
    message: '',
  });

  const load = useCallback(() => {
    if (!id) return;
    setFailed(false);
    Promise.all([
      adminAPI.getClassOverview(id),
      adminAPI.getClassStudents(id),
      adminAPI.getTimetable({ classId: id }),
      adminAPI.getTeachers(),
      adminAPI.getAssignments(),
    ])
      .then(([ov, st, tt, te, as]) => {
        setOverview(ov.data.data);
        setStudents(st.data.data ?? []);
        setCapacity(st.data.capacity ?? 40);
        setTimetable(tt.data.data ?? []);
        setTeachers((te.data.data ?? []).filter((t: any) => t.status !== 'INACTIVE'));
        setAllAssignments((as.data.data ?? []).filter((a: any) => a.isActive !== false));
      })
      .catch(() => {
        setFailed(true);
        toast.error(tr('Could not load this class'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const rows: any[] = overview?.rows ?? [];
  const cls = overview?.class;
  const assigned = rows.filter((r) => r.assignment);

  /** Teachers for a subject: those who already teach it first. */
  const teacherOptions = useCallback(
    (subject: any) => {
      const teachesIt = new Set(allAssignments.filter((a) => a.subjectId?._id === subject._id).map((a) => a.teacherId?._id));
      const specMatch = (t: any) => (t.specialization || '').toLowerCase().includes(String(subject.name).split(' ')[0].toLowerCase());
      return teachers
        .map((t) => ({ t, score: teachesIt.has(t._id) ? 2 : specMatch(t) ? 1 : 0 }))
        .sort((a, b) => b.score - a.score || a.t.fullName.localeCompare(b.t.fullName))
        .map(({ t, score }) => ({
          value: t._id,
          label: t.fullName,
          hint: [score === 2 ? `Teaches ${subject.name}` : null, t.specialization].filter(Boolean).join(' · '),
        }));
    },
    [teachers, allAssignments]
  );

  const assign = async (subject: any, teacherId: string | null) => {
    setAssigning(subject._id);
    try {
      await adminAPI.assignClassTeacher(id, { subjectId: subject._id, teacherId });
      toast.success(teacherId ? tr('{name}: teacher assigned', { name: subject.name }) : tr('{name}: teacher removed', { name: subject.name }));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, tr('Could not change the teacher')));
    } finally {
      setAssigning(null);
    }
  };

  const openRequest = (subjectId?: string, kind?: 'grades' | 'attendance') => {
    setReq((r) => ({
      ...r,
      subjectIds: subjectId ? [subjectId] : assigned.map((x) => x.subject._id),
      grades: kind ? kind === 'grades' : true,
      attendance: kind ? kind === 'attendance' : true,
    }));
    setReqOpen(true);
  };

  const sendRequest = async () => {
    const types = [req.grades && 'GRADES', req.attendance && 'ATTENDANCE'].filter(Boolean);
    setSending(true);
    try {
      const r = await adminAPI.requestFromTeachers(id, {
        subjectIds: req.subjectIds,
        types,
        term: req.term,
        upTo: req.upTo || undefined,
        dueDate: req.dueDate || undefined,
        message: req.message,
      });
      toast.success(tr('Sent {sent} {value} — teachers see them on their profile', { sent: r.data.data.sent, value: r.data.data.sent === 1 ? 'request' : 'requests' }));
      setReqOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, tr('Could not send the request')));
    } finally {
      setSending(false);
    }
  };

  const cancelRequest = async (r: any) => {
    try {
      await adminAPI.cancelTeacherRequest(r._id);
      toast.success(tr('Request withdrawn'));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, tr('Could not withdraw the request')));
    }
  };

  const openCount = useMemo(() => rows.reduce((n, r) => n + r.requests.filter((x: any) => x.status === 'OPEN').length, 0), [rows]);

  if (loading) return <DetailSkeleton />;
  if (failed || !cls) return <ErrorState description={tr('This class did not load.')} onRetry={load} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/classes">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {tr('All classes')}
        </Link>
      </Button>

      <PageHeader
        title={`${cls.name} ${cls.section ?? ''}`.trim()}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/admin/timetable">
                <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                {tr('Edit routine')}
              </Link>
            </Button>
            <Button onClick={() => openRequest()} disabled={!assigned.length}>
              <Send className="h-4 w-4" strokeWidth={1.75} />
              {tr('Request from teachers')}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Fact label={tr('Room')} value={cls.room || '—'} />
        <Fact label={tr('Subjects')} value={`${rows.length}`} sub={tr('{length} with a teacher', { length: assigned.length })} />
        <Fact label={tr('Open requests')} value={String(openCount)} />
        <div className="rounded-[18px] border border-line bg-surface p-4 shadow-card">
          <p className="mb-2 text-meta text-ink-subtle">{tr('Enrolment')}</p>
          <CapacityBar enrolled={students.length} capacity={capacity} />
        </div>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects" indicatorId="class-tabs">
            {tr('Subjects & teachers')}
          </TabsTrigger>
          <TabsTrigger value="students" indicatorId="class-tabs">
            {tr('Students')}{' '}<span className="ml-1.5 text-meta text-ink-subtle tabular">{students.length}</span>
          </TabsTrigger>
          <TabsTrigger value="routine" indicatorId="class-tabs">
            {tr('Routine')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="pt-5">
          {!rows.length ? (
            <div className="rounded-[18px] border border-line bg-surface shadow-card">
              <EmptyState
                icon={BookOpen}
                title={tr('This class has no subjects yet')}
                description={tr('Add the NCTB subjects for this class first.')}
                action={
                  <Button asChild>
                    <Link href="/admin/subjects">{tr('Go to Subjects')}</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => {
                const openReqs = r.requests.filter((x: any) => x.status === 'OPEN');
                const doneReqs = r.requests.filter((x: any) => x.status === 'DONE').slice(0, 2);
                return (
                  <li key={r.subject._id} className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 items-center gap-3 lg:w-64 lg:shrink-0">
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-meta font-bold text-ink', subjectTint(r.subject))}>
                          {r.subject.code}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-dense font-semibold text-ink">{r.subject.name}</p>
                          {r.subject.nameBn && (
                            <p lang="bn" className="truncate font-bn text-meta text-ink-muted">
                              {r.subject.nameBn}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {r.assignment ? (
                          <PersonAvatar name={r.assignment.teacher?.fullName} className="h-9 w-9 shrink-0" />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning">
                            <UserX className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                        )}
                        <div className="w-full max-w-xs">
                          <Combobox
                            options={teacherOptions(r.subject)}
                            value={r.assignment?.teacher?._id ?? ''}
                            onChange={(v) => v !== r.assignment?.teacher?._id && assign(r.subject, v)}
                            placeholder={tr('Assign a teacher')}
                            searchPlaceholder={tr('Find a teacher')}
                            disabled={assigning === r.subject._id}
                          />
                        </div>
                        {r.assignment && (
                          <Button variant="ghost" size="icon-sm" aria-label={tr('Remove the {name} teacher', { name: r.subject.name })} onClick={() => assign(r.subject, null)}>
                            <X className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {r.finalGrades.map((f: any) => (
                          <span key={f.term} className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-meta font-medium text-success">
                            <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            {tr('{termLabel} grades in', { termLabel: termLabel(f.term) })}
                          </span>
                        ))}
                        <Button variant="secondary" size="sm" disabled={!r.assignment} onClick={() => openRequest(r.subject._id, 'grades')}>
                          {tr('Request grades')}
                        </Button>
                        <Button variant="secondary" size="sm" disabled={!r.assignment} onClick={() => openRequest(r.subject._id, 'attendance')}>
                          {tr('Request attendance')}
                        </Button>
                      </div>
                    </div>

                    {(openReqs.length > 0 || doneReqs.length > 0) && (
                      <div className="flex flex-wrap gap-2 border-t border-line bg-surface-sunken/60 px-4 py-2.5">
                        {openReqs.map((x: any) => (
                          <span key={x._id} className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-meta font-medium text-warning">
                            <Clock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            {x.type === 'GRADES' ? tr('{termLabel} grades', { termLabel: termLabel(x.term) }) : tr('Attendance')}{' '}{tr('requested')}
                            {x.dueDate ? tr(' · due {fmtDay}', { fmtDay: fmtDay(x.dueDate) }) : ''}
                            <button type="button" onClick={() => cancelRequest(x)} className="ml-0.5 rounded-full hover:text-ink" aria-label={tr('Withdraw request')}>
                              <X className="h-3 w-3" strokeWidth={2} />
                            </button>
                          </span>
                        ))}
                        {doneReqs.map((x: any) => (
                          <span key={x._id} className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-meta font-medium text-success">
                            <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                            {x.type === 'GRADES' ? tr('{termLabel} grades', { termLabel: termLabel(x.term) }) : tr('Attendance')}{' '}{tr('submitted {fmtDay}', { fmtDay: fmtDay(x.completedAt) })}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="students" className="pt-5">
          <Panel title={tr('{length} students', { length: students.length })}>
            {!students.length ? (
              <EmptyState
                icon={GraduationCap}
                title={tr('No students in this class')}
                description={tr('Admit a student and assign them to this class.')}
                compact
                action={
                  <Button size="sm" asChild>
                    <Link href="/admin/students">{tr('Admit a student')}</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {students.map((s: any, i: number) => (
                  <li key={s._id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-6 shrink-0 text-meta text-ink-subtle tabular">{s.rollNumber || i + 1}</span>
                    <PersonAvatar name={s.fullName} src={s.photoUrl} className="h-8 w-8" />
                    <Link href={`/admin/students/${s._id}`} className="min-w-0 flex-1 truncate text-dense font-medium text-ink hover:text-brand hover:underline">
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

        <TabsContent value="routine" className="pt-5">
          <TimetableGrid entries={timetable} secondary="teacher" />
        </TabsContent>
      </Tabs>

      <Sheet open={reqOpen} onOpenChange={(o) => !sending && setReqOpen(o)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{tr('Request from teachers')}</SheetTitle>
            <SheetDescription>
              {tr('{name} {section}. Each teacher gets a notification and sees the request on their profile.', { name: cls.name, section: cls.section })}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-5">
            <div>
              <p className="mb-2 text-dense font-medium text-ink">{tr('Ask for')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Toggle on={req.grades} onClick={() => setReq((r) => ({ ...r, grades: !r.grades }))} title={tr('Final grades')} text={tr('For the term below')} />
                <Toggle on={req.attendance} onClick={() => setReq((r) => ({ ...r, attendance: !r.attendance }))} title={tr('Attendance')} text={tr('Register brought up to date')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {req.grades && (
                <Field label={tr('Term')}>
                  {(p) => (
                    <Combobox
                      {...p}
                      options={[
                        { value: 'TERM_1', label: tr('Term 1 (half-yearly)') },
                        { value: 'TERM_2', label: tr('Term 2') },
                        { value: 'FINAL', label: tr('Final (annual)') },
                      ]}
                      value={req.term}
                      onChange={(v) => setReq((r) => ({ ...r, term: v }))}
                    />
                  )}
                </Field>
              )}
              {req.attendance && (
                <Field label={tr('Attendance up to')} description={tr('Optional, e.g. the day before the exam.')}>
                  {(p) => <Input {...p} type="date" value={req.upTo} onChange={(e) => setReq((r) => ({ ...r, upTo: e.target.value }))} />}
                </Field>
              )}
              <Field label={tr('Due by')}>
                {(p) => <Input {...p} type="date" value={req.dueDate} onChange={(e) => setReq((r) => ({ ...r, dueDate: e.target.value }))} />}
              </Field>
            </div>

            <div>
              <p className="mb-2 text-dense font-medium text-ink">{tr('Teachers')}</p>
              <ul className="space-y-1.5">
                {assigned.map((r) => {
                  const on = req.subjectIds.includes(r.subject._id);
                  return (
                    <li key={r.subject._id}>
                      <label className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2', on ? 'border-brand/40 bg-brand-wash' : 'border-line')}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                          checked={on}
                          onChange={(e) =>
                            setReq((x) => ({
                              ...x,
                              subjectIds: e.target.checked ? [...x.subjectIds, r.subject._id] : x.subjectIds.filter((s) => s !== r.subject._id),
                            }))
                          }
                        />
                        <span className="min-w-0 flex-1 truncate text-dense text-ink">{r.assignment.teacher?.fullName}</span>
                        <span className="shrink-0 text-meta text-ink-muted">{r.subject.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Field label={tr('Message')} description={tr('Optional.')}>
              {(p) => (
                <Textarea {...p} rows={3} value={req.message} onChange={(e) => setReq((r) => ({ ...r, message: e.target.value }))} placeholder={tr('Needed for the half-yearly result sheet.')} />
              )}
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setReqOpen(false)}>
              {tr('Cancel')}
            </Button>
            <Button onClick={sendRequest} loading={sending} disabled={!req.subjectIds.length || (!req.grades && !req.attendance)}>
              <Send className="h-4 w-4" strokeWidth={1.75} />
              {tr('Send to {length}', { length: req.subjectIds.length })}{' '}{req.subjectIds.length === 1 ? tr('teacher') : tr('teachers')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-4 shadow-card">
      <p className="text-meta text-ink-subtle">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink tabular">{value}</p>
      {sub && <p className="text-meta text-ink-muted">{sub}</p>}
    </div>
  );
}

function Toggle({ on, onClick, title, text }: { on: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        on ? 'border-brand bg-brand-wash' : 'border-line hover:border-line-strong'
      )}
    >
      <span className={cn('flex items-center gap-1.5 text-dense font-semibold', on ? 'text-brand' : 'text-ink')}>
        {on && <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        {title}
      </span>
      <span className="text-meta text-ink-muted">{text}</span>
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-[18px]" />
    </div>
  );
}
