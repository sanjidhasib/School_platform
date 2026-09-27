'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Timer, ListChecks, Users, PenLine, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { apiErrorMessage, cn } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';
import { PHASE_META, testPhase, fmtWhen, toLocalInput } from '@/lib/design/classTests';

export default function TeacherTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ teacherAssignmentId: '', title: '', durationMinutes: 20, opensAt: '', closesAt: '' });

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([teacherAPI.getTests(), teacherAPI.getAssignments()])
      .then(([t, a]) => {
        setTests(t.data.data ?? []);
        setAssignments(a.data.data ?? []);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your tests');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openNew = () => {
    // Sensible defaults: opens at the next quarter hour, open for a day.
    const start = new Date();
    start.setMinutes(Math.ceil((start.getMinutes() + 1) / 15) * 15, 0, 0);
    const end = new Date(start.getTime() + 24 * 3600_000);
    setForm({
      teacherAssignmentId: assignments[0]?._id ?? '',
      title: '',
      durationMinutes: 20,
      opensAt: toLocalInput(start),
      closesAt: toLocalInput(end),
    });
    setOpen(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await teacherAPI.createTest({
        ...form,
        opensAt: new Date(form.opensAt).toISOString(),
        closesAt: new Date(form.closesAt).toISOString(),
      });
      toast.success('Test created — now add the questions');
      router.push(`/teacher/tests/${res.data.data._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the test'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class tests"
        description="Timed tests your students sit online. Multiple-choice answers mark themselves."
        actions={
          <Button onClick={openNew} disabled={!assignments.length}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New test
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-[18px]" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState description="Your tests did not load." onRetry={load} />
      ) : !tests.length ? (
        <div className="rounded-[18px] border border-line bg-surface shadow-card">
          <EmptyState
            icon={Timer}
            title="No class tests yet"
            description="Set questions, choose a time limit, and your class sits it online."
            action={
              <Button onClick={openNew} disabled={!assignments.length}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                New test
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((t) => {
            const phase = testPhase(t);
            const meta = PHASE_META[phase];
            return (
              <li key={t._id}>
                <Link
                  href={`/teacher/tests/${t._id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span className={cn('h-1.5', subjectTint(t.subjectId))} aria-hidden="true" />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-meta font-semibold', meta.tone)}>{meta.label}</span>
                      {t.toMark > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-highlighter-wash px-2 py-0.5 text-meta font-medium text-warning">
                          <PenLine className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                          {t.toMark} to mark
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-ink group-hover:text-brand">{t.title}</p>
                      <p className="mt-0.5 text-meta text-ink-muted">
                        {t.classId?.name} {t.classId?.section} · {t.subjectId?.name}
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-meta">
                      <Stat icon={Timer} label="Time" value={`${t.durationMinutes} min`} />
                      <Stat icon={ListChecks} label="Questions" value={`${t.questionCount} · ${t.totalMarks} marks`} />
                      <Stat icon={Users} label="Sat it" value={String(t.attempts)} />
                    </div>
                    <p className="flex items-center justify-between text-meta text-ink-subtle">
                      <span>
                        {fmtWhen(t.opensAt)} → {fmtWhen(t.closesAt)}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" strokeWidth={1.75} aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New class test</SheetTitle>
            <SheetDescription>Set it up first; you add the questions on the next screen.</SheetDescription>
          </SheetHeader>
          <form onSubmit={create} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label="Class and subject" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={assignments.map((a) => ({
                      value: a._id,
                      label: `${a.classId?.name ?? ''} ${a.classId?.section ?? ''} · ${a.subjectId?.name ?? ''}`.trim(),
                    }))}
                    value={form.teacherAssignmentId}
                    onChange={(v) => setForm((f) => ({ ...f, teacherAssignmentId: v }))}
                    placeholder="Choose a class"
                  />
                )}
              </Field>
              <Field label="Title" required>
                {(p) => (
                  <Input {...p} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Class test 3 — Fractions" required />
                )}
              </Field>
              <Field label="Time limit" required description="Minutes each student gets once they press Start.">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    max={300}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
                    required
                  />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Opens" required>
                  {(p) => <Input {...p} type="datetime-local" value={form.opensAt} onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))} required />}
                </Field>
                <Field label="Closes" required>
                  {(p) => <Input {...p} type="datetime-local" value={form.closesAt} onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))} required />}
                </Field>
              </div>
              <p className="text-meta text-ink-subtle">
                Students can start any time between these. Nobody gets time beyond the closing time.
              </p>
            </SheetBody>
            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={!form.teacherAssignmentId || !form.title.trim()}>
                Create and add questions
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-ink-subtle">
        <Icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
        {label}
      </p>
      <p className="truncate font-medium text-ink">{value}</p>
    </div>
  );
}
