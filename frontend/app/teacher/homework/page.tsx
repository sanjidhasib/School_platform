'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ClipboardCheck, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { apiErrorMessage, cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { HOMEWORK_TYPES, homeworkType, type HomeworkType } from '@/lib/design/homework';
import { subjectBn } from '@/lib/design/subjects';

const emptyForm = {
  teacherAssignmentId: '',
  type: 'HOMEWORK' as HomeworkType,
  title: '',
  description: '',
  dueAt: '',
  maxMarks: 10,
};

export default function TeacherHomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /** The submission being graded, in a proper form rather than window.prompt(). */
  const [grading, setGrading] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getHomework()
      .then((r) => setHomeworks(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load homework');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    teacherAPI.getAssignments().then((r) => setAssignments(r.data.data ?? [])).catch(() => setAssignments([]));
  }, [load]);

  const assignmentOptions = useMemo(
    () =>
      assignments.map((a: any) => ({
        value: a._id,
        label: `${a.subjectId?.name ?? 'Subject'} — ${a.classId?.name ?? ''} ${a.classId?.section ?? ''}`.trim(),
        hint: subjectBn(a.subjectId) ?? undefined,
      })),
    [assignments]
  );

  const loadSubmissions = async (hw: any) => {
    setSelected(hw);
    setLoadingSubs(true);
    try {
      const res = await teacherAPI.getHomeworkSubmissions(hw._id);
      setSubmissions(res.data.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load submissions'));
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignment = assignments.find((a: any) => a._id === form.teacherAssignmentId);
    if (!assignment) {
      toast.error('Choose the class and subject first');
      return;
    }
    setSaving(true);
    try {
      await teacherAPI.createHomework({
        teacherAssignmentId: assignment._id,
        classId: assignment.classId?._id,
        subjectId: assignment.subjectId?._id,
        type: form.type,
        title: form.title,
        description: form.description,
        assignedAt: new Date().toISOString(),
        dueAt: form.dueAt,
        maxMarks: form.maxMarks,
      });
      toast.success('Homework published');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not publish the homework'));
    } finally {
      setSaving(false);
    }
  };

  const openGrade = (submission: any) => {
    setGrading(submission);
    setGradeForm({
      marks: submission.marks !== undefined && submission.marks !== null ? String(submission.marks) : '',
      feedback: submission.feedback ?? '',
    });
    setGradeError(null);
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const max = selected?.maxMarks ?? 100;
    const marks = Number(gradeForm.marks);

    if (gradeForm.marks === '' || Number.isNaN(marks)) {
      setGradeError('Enter the marks awarded.');
      return;
    }
    if (marks < 0 || marks > max) {
      setGradeError(`Marks must be between 0 and ${max}.`);
      return;
    }

    setGradeError(null);
    setSavingGrade(true);
    try {
      await teacherAPI.gradeSubmission(grading._id, {
        marks,
        feedback: gradeForm.feedback,
        status: 'GRADED',
      });
      toast.success(`${grading.student?.fullName ?? 'Submission'} graded`);
      setGrading(null);
      loadSubmissions(selected);
    } catch (err) {
      setGradeError(apiErrorMessage(err, 'Could not save the grade'));
    } finally {
      setSavingGrade(false);
    }
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    const statusOf = (row: any) => row?.submission?.status ?? 'NOT_SUBMITTED';
    const turnedIn = submissions.filter((r) =>
      ['SUBMITTED', 'LATE', 'GRADED'].includes(statusOf(r))
    ).length;
    const graded = submissions.filter((r) => statusOf(r) === 'GRADED').length;
    const waiting = submissions.filter((r) => ['SUBMITTED', 'LATE'].includes(statusOf(r))).length;

    return (
      <div className="space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(null)}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          All homework
        </Button>

        <div className="space-y-3">
          <h1 className="text-page text-ink">{selected.title}</h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-4">
            <div>
              <dt className="text-meta text-ink-subtle">Class</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink">
                {selected.classId?.name} {selected.classId?.section}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Subject</dt>
              <dd className="mt-0.5">
                <SubjectLabel subject={selected.subjectId} className="text-dense font-medium text-ink" inline />
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Due</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink tabular">
                {formatDate(selected.dueAt)}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Out of</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink tabular">{selected.maxMarks}</dd>
            </div>
          </dl>
        </div>

        {selected.description && (
          <p className="max-w-2xl whitespace-pre-line text-body text-ink-muted">
            {selected.description}
          </p>
        )}

        {submissions.length > 0 && (
          <div className="max-w-md space-y-1.5">
            <div className="flex items-baseline justify-between text-meta">
              <span className="text-ink-muted tabular">
                {turnedIn} of {submissions.length} turned in
              </span>
              {waiting > 0 && (
                <span className="font-medium text-warning tabular">{waiting} to grade</span>
              )}
            </div>
            <Progress
              value={submissions.length ? (graded / submissions.length) * 100 : 0}
              tone="success"
            />
          </div>
        )}

        {loadingSubs ? (
          <ListSkeleton rows={5} />
        ) : !submissions.length ? (
          <div className="rounded-card border border-line bg-surface shadow-card">
            <EmptyState
              icon={ClipboardCheck}
              title="No students in this class yet"
              description="Submissions appear here once students turn their work in."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
            {submissions.map((row: any) => {
              const student = row.student ?? {};
              const submission = row.submission ?? {};
              const status = submission.status ?? 'NOT_SUBMITTED';
              // Only a real submission has an id to grade against.
              const canGrade = Boolean(submission._id) && ['SUBMITTED', 'LATE', 'GRADED'].includes(status);

              return (
                <li
                  key={student._id ?? submission._id}
                  className="flex flex-wrap items-start gap-3 px-4 py-3"
                >
                  <PersonAvatar
                    name={student.fullName}
                    src={student.photoUrl}
                    className="h-8 w-8 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-dense font-medium text-ink">
                        {student.fullName ?? 'Student'}
                      </p>
                      <StatusPill status={status} />
                    </div>
                    {student.studentId && (
                      <p className="mt-0.5 text-meta text-ink-subtle tabular">{student.studentId}</p>
                    )}
                    {submission.answerText && (
                      <p className="mt-1 line-clamp-2 text-dense text-ink-muted">
                        {submission.answerText}
                      </p>
                    )}
                    {submission.submittedAt && (
                      <p className="mt-1 text-meta text-ink-subtle">
                        Turned in {formatRelativeTime(submission.submittedAt)}
                      </p>
                    )}
                    {submission.feedback && (
                      <p className="mt-1 text-meta text-ink-muted">
                        Feedback: {submission.feedback}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {status === 'GRADED' && submission.marks !== undefined && (
                      <span className="text-dense font-semibold text-ink tabular">
                        {submission.marks} / {selected.maxMarks}
                      </span>
                    )}
                    {canGrade ? (
                      <Button
                        variant={status === 'GRADED' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => openGrade({ ...submission, student })}
                      >
                        {status === 'GRADED' ? 'Change marks' : 'Grade'}
                      </Button>
                    ) : (
                      <span className="text-meta text-ink-subtle">Not submitted</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Sheet open={!!grading} onOpenChange={(o) => !o && setGrading(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Grade this submission</SheetTitle>
              <SheetDescription>
                {grading?.student?.fullName} · {selected.title}
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={submitGrade} className="flex min-h-0 flex-1 flex-col">
              <SheetBody className="space-y-4">
                {grading?.answerText && (
                  <div className="rounded-card border border-line bg-surface-sunken p-3">
                    <p className="mb-1 text-meta font-medium text-ink-subtle">Their answer</p>
                    <p className="whitespace-pre-line text-dense text-ink">{grading.answerText}</p>
                  </div>
                )}

                <Field
                  label="Marks"
                  description={`Out of ${selected.maxMarks}.`}
                  error={gradeError}
                  required
                >
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={0}
                      max={selected.maxMarks}
                      step="any"
                      inputMode="decimal"
                      value={gradeForm.marks}
                      onChange={(e) => {
                        setGradeForm((f) => ({ ...f, marks: e.target.value }));
                        setGradeError(null);
                      }}
                      className="max-w-[8rem]"
                      required
                    />
                  )}
                </Field>

                <Field label="Feedback" description="Optional. The student sees this.">
                  {(p) => (
                    <Textarea
                      {...p}
                      rows={4}
                      value={gradeForm.feedback}
                      onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                    />
                  )}
                </Field>
              </SheetBody>

              <SheetFooter>
                <Button type="button" variant="secondary" onClick={() => setGrading(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={savingGrade}>
                  <Check className="h-4 w-4" strokeWidth={1.75} />
                  Save marks
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <PageHeader
        title="Homework"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Set homework
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : failed ? (
        <ErrorState description="Your homework list did not load." onRetry={load} />
      ) : !homeworks.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={ClipboardCheck}
            title="No homework set"
            description="Set homework for a class and track who has turned it in."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Set homework
              </Button>
            }
          />
        </div>
      ) : (
        /* A stream of assignments, Classroom-style: title, then when it is due. */
        <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
          {homeworks.map((h: any) => {
            const overdue = h.dueAt && new Date(h.dueAt) < new Date();
            const dueSoon =
              !overdue &&
              h.dueAt &&
              new Date(h.dueAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

            return (
              <li key={h._id}>
                <button
                  type="button"
                  onClick={() => loadSubmissions(h)}
                  className={cn(
                    'flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-wash/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-dense font-medium text-ink">{h.title}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-meta font-medium', homeworkType(h.type).tone)}>
                        {homeworkType(h.type).label}
                      </span>
                      <StatusPill status={h.status} />
                      {dueSoon && <Badge tone="warning">Due soon</Badge>}
                      {overdue && h.status === 'PUBLISHED' && <Badge tone="neutral">Past due</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                      <SubjectLabel subject={h.subjectId} className="text-meta text-ink-muted" inline />
                      <span className="text-meta text-ink-subtle">
                        {h.classId?.name} {h.classId?.section}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-meta text-ink-subtle">Due</p>
                    <p className="text-dense text-ink tabular">{formatDate(h.dueAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Set homework</SheetTitle>
            <SheetDescription>Students in the class see it straight away.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label="Class and subject" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={assignmentOptions}
                    value={form.teacherAssignmentId}
                    onChange={(v) => setForm((f) => ({ ...f, teacherAssignmentId: v }))}
                    placeholder="Choose a class"
                    searchPlaceholder="Find a class"
                  />
                )}
              </Field>

              <Field label="Kind of work" required description={homeworkType(form.type).hint}>
                {() => (
                  <div className="grid grid-cols-3 gap-1 rounded-btn border border-line p-0.5" role="group" aria-label="Kind of work">
                    {HOMEWORK_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={form.type === t.value}
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={cn(
                          'rounded-chip px-2 py-1.5 text-meta font-medium leading-tight transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                          form.type === t.value ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
                        )}
                      >
                        {t.value === 'NEXT_CLASS' ? 'Next class prep' : t.label}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Title" required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Fractions worksheet"
                    required
                  />
                )}
              </Field>

              <Field label="What to do" required>
                {(p) => (
                  <Textarea
                    {...p}
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Due date" required>
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      value={form.dueAt}
                      onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                      required
                    />
                  )}
                </Field>
                <Field label="Out of" required>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={1}
                      value={form.maxMarks}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxMarks: parseInt(e.target.value, 10) || 0 }))
                      }
                      required
                    />
                  )}
                </Field>
              </div>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={!form.teacherAssignmentId}>
                Publish
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
