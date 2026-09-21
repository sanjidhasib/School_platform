'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Plus, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { ListSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { apiErrorMessage, cn, formatDate } from '@/lib/utils';
import { subjectBn } from '@/lib/design/subjects';

const ASSESSMENT_TYPES = ['CLASS_TEST', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PRACTICAL', 'OTHER'];
const TERMS = ['TERM_1', 'TERM_2', 'FINAL'];

const emptyForm = {
  teacherAssignmentId: '',
  title: '',
  type: 'CLASS_TEST',
  term: 'TERM_1',
  assessmentDate: new Date().toISOString().split('T')[0],
  maxMarks: 100,
  weight: 1,
};

interface MarkRow {
  studentId: string;
  fullName: string;
  studentCode: string;
  value: string;
  absent: boolean;
}

export default function TeacherResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Marks grid
  const [selected, setSelected] = useState<any>(null);
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [initialRows, setInitialRows] = useState<MarkRow[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getAssessments()
      .then((r) => setAssessments(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load assessments');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignment = assignments.find((a: any) => a._id === form.teacherAssignmentId);
    if (!assignment) {
      setFormError('Choose the class and subject this assessment belongs to.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await teacherAPI.createAssessment({
        ...form,
        classId: assignment.classId?._id,
        subjectId: assignment.subjectId?._id,
        academicSessionId: assignment.academicSessionId,
      });
      toast.success('Assessment created');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create the assessment'));
    } finally {
      setSaving(false);
    }
  };

  const openMarks = async (assessment: any) => {
    setSelected(assessment);
    setLoadingMarks(true);
    try {
      const res = await teacherAPI.getMarks(assessment._id);
      const { students, marks } = res.data.data;
      const built: MarkRow[] = (students ?? []).map((s: any) => ({
        studentId: s._id,
        fullName: s.fullName,
        studentCode: s.studentId,
        value:
          marks?.[s._id]?.obtainedMarks !== undefined && marks?.[s._id]?.obtainedMarks !== null
            ? String(marks[s._id].obtainedMarks)
            : '',
        absent: Boolean(marks?.[s._id]?.absent),
      }));
      setRows(built);
      setInitialRows(built);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load the marks sheet'));
      setSelected(null);
    } finally {
      setLoadingMarks(false);
    }
  };

  const updateRow = (index: number, patch: Partial<MarkRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  /** Enter and the arrow keys move down the column, as in a spreadsheet. */
  const onCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    }
  };

  const max = selected?.maxMarks ?? 100;

  const invalidRows = rows.filter(
    (r) => !r.absent && r.value !== '' && (Number.isNaN(Number(r.value)) || Number(r.value) < 0 || Number(r.value) > max)
  );
  const dirty = JSON.stringify(rows) !== JSON.stringify(initialRows);
  const entered = rows.filter((r) => r.absent || r.value !== '').length;

  const saveMarks = async () => {
    if (invalidRows.length) {
      toast.error(`Marks must be between 0 and ${max}`);
      return;
    }
    setSavingMarks(true);
    try {
      const payload = rows
        .filter((r) => r.absent || r.value !== '')
        .map((r) => ({
          studentId: r.studentId,
          obtainedMarks: r.absent ? 0 : Number(r.value),
          absent: r.absent,
        }));
      await teacherAPI.saveMarks(selected._id, payload);
      setInitialRows(rows);
      toast.success('Marks saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the marks'));
    } finally {
      setSavingMarks(false);
    }
  };

  // ── Marks grid ─────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-5 pb-24">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => {
            if (dirty && !window.confirm('You have unsaved marks. Leave without saving?')) return;
            setSelected(null);
          }}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          All assessments
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
              <dt className="text-meta text-ink-subtle">Out of</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink tabular">{max}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Date</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink tabular">
                {formatDate(selected.assessmentDate)}
              </dd>
            </div>
          </dl>
        </div>

        {loadingMarks ? (
          <TableSkeleton cols={4} />
        ) : !rows.length ? (
          <div className="rounded-card border border-line bg-surface">
            <EmptyState
              icon={BarChart3}
              title="No students in this class"
              description="Marks can be entered once students are enrolled."
            />
          </div>
        ) : (
          <>
            <p className="text-meta text-ink-subtle">
              Press Enter or the down arrow to move to the next student.
            </p>

            <div className="scrollbar-thin overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full border-collapse text-dense">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-10 px-3 py-2 text-left text-meta font-medium text-ink-subtle">
                      #
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-meta font-medium text-ink-subtle">
                      Student
                    </th>
                    <th scope="col" className="hidden px-3 py-2 text-left text-meta font-medium text-ink-subtle sm:table-cell">
                      ID
                    </th>
                    <th scope="col" className="w-28 px-3 py-2 text-right text-meta font-medium text-ink-subtle">
                      Marks
                    </th>
                    <th scope="col" className="w-24 px-3 py-2 text-center text-meta font-medium text-ink-subtle">
                      Absent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row, i) => {
                    const num = Number(row.value);
                    const invalid =
                      !row.absent && row.value !== '' && (Number.isNaN(num) || num < 0 || num > max);

                    return (
                      <tr key={row.studentId} className="hover:bg-wash/40">
                        <td className="px-3 py-1.5 text-meta text-ink-subtle tabular">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium text-ink">{row.fullName}</td>
                        <td className="hidden px-3 py-1.5 text-ink-muted tabular sm:table-cell">
                          {row.studentCode}
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            ref={(el) => {
                              inputsRef.current[i] = el;
                            }}
                            type="number"
                            min={0}
                            max={max}
                            step="any"
                            inputMode="decimal"
                            disabled={row.absent}
                            value={row.value}
                            aria-label={`Marks for ${row.fullName}, out of ${max}`}
                            aria-invalid={invalid || undefined}
                            onChange={(e) => updateRow(i, { value: e.target.value })}
                            onKeyDown={(e) => onCellKeyDown(e, i)}
                            onFocus={(e) => e.currentTarget.select()}
                            className={cn(
                              'h-8 w-full rounded-chip border bg-surface px-2 text-right text-dense tabular',
                              'focus:outline-none focus:ring-2 focus:ring-brand/25',
                              'disabled:cursor-not-allowed disabled:opacity-50',
                              invalid ? 'border-danger focus:border-danger' : 'border-line focus:border-brand'
                            )}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.absent}
                            aria-label={`Mark ${row.fullName} absent`}
                            onChange={(e) =>
                              updateRow(i, { absent: e.target.checked, value: e.target.checked ? '' : row.value })
                            }
                            className="h-4 w-4 cursor-pointer rounded border-line text-brand focus:ring-2 focus:ring-brand/25"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:left-60">
              <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3">
                <p className="text-meta text-ink-muted tabular">
                  {entered} of {rows.length} entered
                </p>

                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-meta font-medium text-danger">
                    <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                    {invalidRows.length} out of range
                  </span>
                )}

                {dirty ? (
                  <Badge tone="warning">Unsaved changes</Badge>
                ) : entered > 0 ? (
                  <span className="flex items-center gap-1.5 text-meta font-medium text-success">
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                    All saved
                  </span>
                ) : null}

                <Button
                  className="ml-auto"
                  onClick={saveMarks}
                  loading={savingMarks}
                  disabled={!dirty || invalidRows.length > 0}
                >
                  Save marks
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Assessment list ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <PageHeader
        title="Results"
        description="Create an assessment, then enter marks for the class."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New assessment
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : failed ? (
        <ErrorState description="Your assessments did not load." onRetry={load} />
      ) : !assessments.length ? (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={BarChart3}
            title="No assessments yet"
            description="Create a class test or exam, then enter marks against it."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                New assessment
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {assessments.map((a: any) => (
            <li key={a._id}>
              <button
                type="button"
                onClick={() => openMarks(a)}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-wash/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-dense font-medium text-ink">{a.title}</span>
                    <StatusPill status={a.status} />
                    <Badge tone="outline">{a.type?.replace(/_/g, ' ').toLowerCase()}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4">
                    <SubjectLabel subject={a.subjectId} className="text-meta text-ink-muted" inline />
                    <span className="text-meta text-ink-subtle">
                      {a.classId?.name} {a.classId?.section}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-meta text-ink-subtle">Out of</p>
                  <p className="text-dense text-ink tabular">{a.maxMarks}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New assessment</SheetTitle>
            <SheetDescription>A class test, exam or practical you will enter marks for.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-bg px-3 py-2.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                  <p className="text-dense text-danger">{formError}</p>
                </div>
              )}

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

              <Field label="Title" required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="First class test"
                    required
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" required>
                  {(p) => (
                    <Combobox
                      {...p}
                      options={ASSESSMENT_TYPES.map((t) => ({
                        value: t,
                        label: t.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
                      }))}
                      value={form.type}
                      onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                    />
                  )}
                </Field>
                <Field label="Term" required>
                  {(p) => (
                    <Combobox
                      {...p}
                      options={TERMS.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                      value={form.term}
                      onChange={(v) => setForm((f) => ({ ...f, term: v }))}
                    />
                  )}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date" required>
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      value={form.assessmentDate}
                      onChange={(e) => setForm((f) => ({ ...f, assessmentDate: e.target.value }))}
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
                <Field label="Weight" description="Towards the term grade." required>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={0}
                      step="any"
                      value={form.weight}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, weight: parseFloat(e.target.value) || 0 }))
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
                Create
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
