'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Circle,
  Save,
  Send,
  Square,
  Lock,
  ListChecks,
  AlignLeft,
  Award,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { ErrorState, EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { apiErrorMessage, cn } from '@/lib/utils';
import { PHASE_META, testPhase, fmtWhen, toLocalInput } from '@/lib/design/classTests';

type Q = { _id?: string; key: string; kind: 'MCQ' | 'SHORT'; text: string; options: string[]; correctOption: number | null; marks: number };

let keySeq = 0;
const newKey = () => `q${++keySeq}`;
const blankMcq = (): Q => ({ key: newKey(), kind: 'MCQ', text: '', options: ['', '', '', ''], correctOption: null, marks: 1 });
const blankShort = (): Q => ({ key: newKey(), kind: 'SHORT', text: '', options: [], correctOption: null, marks: 2 });
const LETTERS = 'ABCDEF';

export default function TeacherTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState('questions');

  const [settings, setSettings] = useState({ title: '', instructions: '', durationMinutes: 20, opensAt: '', closesAt: '' });
  const [questions, setQuestions] = useState<Q[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'delete' | 'close' | 'publish'>(null);

  const load = useCallback(() => {
    setFailed(false);
    teacherAPI
      .getTest(id)
      .then((r) => {
        const t = r.data.data;
        setTest(t);
        setSettings({
          title: t.title,
          instructions: t.instructions ?? '',
          durationMinutes: t.durationMinutes,
          opensAt: toLocalInput(t.opensAt),
          closesAt: toLocalInput(t.closesAt),
        });
        setQuestions(
          (t.questions ?? []).map((q: any) => ({
            _id: q._id,
            key: newKey(),
            kind: q.kind,
            text: q.text,
            options: q.options ?? [],
            correctOption: q.correctOption ?? null,
            marks: q.marks,
          }))
        );
        setDirty(false);
      })
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const locked = (test?.attempts ?? 0) > 0;
  const phase = test ? testPhase(test) : 'DRAFT';
  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  const edit = (fn: () => void) => {
    fn();
    setDirty(true);
  };
  const updateQ = (key: string, patch: Partial<Q>) =>
    edit(() => setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q))));
  const moveQ = (i: number, d: number) =>
    edit(() =>
      setQuestions((qs) => {
        const next = [...qs];
        const j = i + d;
        if (j < 0 || j >= next.length) return qs;
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      })
    );

  const payload = () => ({
    title: settings.title,
    instructions: settings.instructions,
    ...(locked ? {} : { durationMinutes: settings.durationMinutes }),
    opensAt: new Date(settings.opensAt).toISOString(),
    closesAt: new Date(settings.closesAt).toISOString(),
    ...(locked
      ? {}
      : {
          questions: questions.map((q) => ({
            _id: q._id,
            kind: q.kind,
            text: q.text,
            marks: Number(q.marks) || 0,
            ...(q.kind === 'MCQ' ? { options: q.options, correctOption: q.correctOption } : {}),
          })),
        }),
  });

  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      await teacherAPI.updateTest(id, payload());
      toast.success('Test saved');
      load();
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the test'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const act = async (what: 'publish' | 'close' | 'delete') => {
    setBusy(what);
    try {
      if (what === 'publish') {
        if (dirty && !(await save())) return;
        await teacherAPI.publishTest(id);
        toast.success('Published — students can see it now');
        load();
      } else if (what === 'close') {
        await teacherAPI.closeTest(id);
        toast.success('Test closed');
        load();
      } else {
        await teacherAPI.deleteTest(id);
        toast.success('Test deleted');
        router.push('/teacher/tests');
      }
      setConfirm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'That didn’t work'));
    } finally {
      setBusy(null);
    }
  };

  if (failed) return <ErrorState description="This test did not load." onRetry={load} />;
  if (!test) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full rounded-[18px]" />
      </div>
    );
  }

  const meta = PHASE_META[phase];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/teacher/tests">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Class tests
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-page text-ink">{test.title}</h1>
              <span className={cn('rounded-full px-2.5 py-0.5 text-meta font-semibold', meta.tone)}>{meta.label}</span>
            </div>
            <p className="mt-1 text-body text-ink-muted">
              {test.classId?.name} {test.classId?.section} · {test.subjectId?.name} · {test.durationMinutes} min ·{' '}
              {fmtWhen(test.opensAt)} → {fmtWhen(test.closesAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase === 'DRAFT' && (
              <Button onClick={() => setConfirm('publish')} disabled={!questions.length}>
                <Send className="h-4 w-4" strokeWidth={1.75} />
                Publish
              </Button>
            )}
            {(phase === 'OPEN' || phase === 'SCHEDULED') && (
              <Button variant="secondary" onClick={() => setConfirm('close')}>
                <Square className="h-4 w-4" strokeWidth={1.75} />
                Close now
              </Button>
            )}
            {!locked && (
              <Button variant="ghost" onClick={() => setConfirm('delete')}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="questions" indicatorId="test-tabs">
            Questions <span className="ml-1.5 text-meta text-ink-subtle tabular">{questions.length}</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" indicatorId="test-tabs">
            Submissions <span className="ml-1.5 text-meta text-ink-subtle tabular">{test.attempts}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-5 pt-5">
          {locked && (
            <p className="flex items-center gap-2 rounded-card border border-line bg-surface-sunken px-4 py-3 text-dense text-ink-muted">
              <Lock className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              Students have started this test, so the questions and time limit are locked. You can still change the title,
              instructions and closing time.
            </p>
          )}

          <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
            {/* Questions */}
            <div className="space-y-4">
              {!questions.length ? (
                <div className="rounded-[18px] border border-dashed border-line-strong bg-surface">
                  <EmptyState icon={ListChecks} title="No questions yet" description="Add multiple-choice questions (marked automatically) or short answers (you mark them)." />
                </div>
              ) : (
                questions.map((q, i) => (
                  <QuestionCard
                    key={q.key}
                    q={q}
                    index={i}
                    count={questions.length}
                    locked={locked}
                    onChange={(patch) => updateQ(q.key, patch)}
                    onMove={(d) => moveQ(i, d)}
                    onRemove={() => edit(() => setQuestions((qs) => qs.filter((x) => x.key !== q.key)))}
                  />
                ))
              )}
              {!locked && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => edit(() => setQuestions((qs) => [...qs, blankMcq()]))}>
                    <ListChecks className="h-4 w-4" strokeWidth={1.75} />
                    Add multiple choice
                  </Button>
                  <Button variant="secondary" onClick={() => edit(() => setQuestions((qs) => [...qs, blankShort()]))}>
                    <AlignLeft className="h-4 w-4" strokeWidth={1.75} />
                    Add short answer
                  </Button>
                </div>
              )}
            </div>

            {/* Settings */}
            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <div className="space-y-4 rounded-[18px] border border-line bg-surface p-5 shadow-card">
                <p className="text-dense font-semibold text-ink">Settings</p>
                <Field label="Title">
                  {(p) => <Input {...p} value={settings.title} onChange={(e) => edit(() => setSettings((s) => ({ ...s, title: e.target.value })))} />}
                </Field>
                <Field label="Instructions" description="Shown before the student starts.">
                  {(p) => (
                    <Textarea
                      {...p}
                      rows={3}
                      value={settings.instructions}
                      onChange={(e) => edit(() => setSettings((s) => ({ ...s, instructions: e.target.value })))}
                      placeholder="Answer all questions. No books."
                    />
                  )}
                </Field>
                <Field label="Time limit (minutes)">
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={1}
                      max={300}
                      disabled={locked}
                      value={settings.durationMinutes}
                      onChange={(e) => edit(() => setSettings((s) => ({ ...s, durationMinutes: parseInt(e.target.value, 10) || 0 })))}
                    />
                  )}
                </Field>
                <Field label="Opens">
                  {(p) => <Input {...p} type="datetime-local" value={settings.opensAt} onChange={(e) => edit(() => setSettings((s) => ({ ...s, opensAt: e.target.value })))} />}
                </Field>
                <Field label="Closes">
                  {(p) => <Input {...p} type="datetime-local" value={settings.closesAt} onChange={(e) => edit(() => setSettings((s) => ({ ...s, closesAt: e.target.value })))} />}
                </Field>
                <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-3 py-2.5 text-dense">
                  <span className="text-ink-muted">Total</span>
                  <span className="font-semibold text-ink tabular">
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'} · {totalMarks} marks
                  </span>
                </div>
                <Button className="w-full" onClick={save} loading={saving} disabled={!dirty}>
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                  {dirty ? 'Save changes' : 'All changes saved'}
                </Button>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="pt-5">
          <Submissions test={test} active={tab === 'submissions'} onChanged={load} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirm === 'publish'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Publish this test?"
        description={
          <>
            <strong className="text-ink">{test.title}</strong> will appear for {test.classId?.name} {test.classId?.section}. They can start it from{' '}
            {fmtWhen(test.opensAt)} until {fmtWhen(test.closesAt)}, with {test.durationMinutes} minutes each.
          </>
        }
        confirmLabel="Publish"
        loading={busy === 'publish'}
        onConfirm={() => act('publish')}
      />
      <ConfirmDialog
        open={confirm === 'close'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Close the test now?"
        description="Nobody else will be able to start it. Students already sitting it keep the rest of their time."
        confirmLabel="Close now"
        loading={busy === 'close'}
        onConfirm={() => act('close')}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete this test?"
        description={
          <>
            <strong className="text-ink">{test.title}</strong> and its questions will be removed.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={busy === 'delete'}
        onConfirm={() => act('delete')}
      />
    </div>
  );
}

function QuestionCard({
  q,
  index,
  count,
  locked,
  onChange,
  onMove,
  onRemove,
}: {
  q: Q;
  index: number;
  count: number;
  locked: boolean;
  onChange: (patch: Partial<Q>) => void;
  onMove: (d: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-meta font-bold text-brand-contrast tabular">{index + 1}</span>
        <div className="flex rounded-btn border border-line p-0.5" role="group" aria-label="Question type">
          {(['MCQ', 'SHORT'] as const).map((k) => (
            <button
              key={k}
              type="button"
              disabled={locked}
              aria-pressed={q.kind === k}
              onClick={() =>
                onChange(k === 'MCQ' ? { kind: k, options: q.options.length >= 2 ? q.options : ['', '', '', ''] } : { kind: k })
              }
              className={cn(
                'rounded-chip px-2.5 py-1 text-meta font-medium transition-colors disabled:cursor-default',
                q.kind === k ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
              )}
            >
              {k === 'MCQ' ? 'Multiple choice' : 'Short answer'}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-meta text-ink-muted">
          Marks
          <input
            type="number"
            min={0}
            max={100}
            disabled={locked}
            value={q.marks}
            onChange={(e) => onChange({ marks: parseFloat(e.target.value) || 0 })}
            className="h-8 w-16 rounded-chip border border-line bg-surface px-2 text-dense text-ink tabular focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60"
          />
        </label>
        {!locked && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
              <ArrowUp className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
              <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove question">
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <Textarea
          value={q.text}
          disabled={locked}
          rows={2}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Write the question…"
          aria-label={`Question ${index + 1}`}
          className="text-body"
        />
        {q.kind === 'MCQ' ? (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const correct = q.correctOption === oi;
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onChange({ correctOption: oi })}
                    aria-pressed={correct}
                    aria-label={`Mark option ${LETTERS[oi]} as the correct answer`}
                    className={cn('shrink-0 rounded-full transition-colors', correct ? 'text-success' : 'text-ink-subtle hover:text-ink')}
                  >
                    {correct ? <CheckCircle2 className="h-5 w-5" strokeWidth={2} /> : <Circle className="h-5 w-5" strokeWidth={1.75} />}
                  </button>
                  <span className="w-5 shrink-0 text-meta font-semibold text-ink-subtle">{LETTERS[oi]}</span>
                  <Input
                    value={opt}
                    disabled={locked}
                    onChange={(e) => onChange({ options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                    placeholder={`Option ${LETTERS[oi]}`}
                    className={cn(correct && 'border-success/50 bg-success-bg/40')}
                  />
                  {!locked && q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove option ${LETTERS[oi]}`}
                      onClick={() =>
                        onChange({
                          options: q.options.filter((_, j) => j !== oi),
                          correctOption: q.correctOption === oi ? null : q.correctOption !== null && q.correctOption > oi ? q.correctOption - 1 : q.correctOption,
                        })
                      }
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {!locked && q.options.length < 6 ? (
                <Button variant="ghost" size="sm" onClick={() => onChange({ options: [...q.options, ''] })}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Add option
                </Button>
              ) : (
                <span />
              )}
              {q.correctOption === null && <span className="text-meta text-warning">Tick the correct answer</span>}
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-sunken px-3 py-2 text-meta text-ink-muted">
            Students type their answer. You mark it in Submissions after they hand in.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Submissions: who sat it, scores, marking, publishing results ──────────

const ATTEMPT_META: Record<string, { label: string; tone: string }> = {
  NONE: { label: 'Not started', tone: 'bg-surface-sunken text-ink-subtle' },
  IN_PROGRESS: { label: 'Sitting now', tone: 'bg-info-bg text-info' },
  SUBMITTED: { label: 'To mark', tone: 'bg-warning-bg text-warning' },
  GRADED: { label: 'Marked', tone: 'bg-success-bg text-success' },
};

function Submissions({ test, active, onChanged }: { test: any; active: boolean; onChanged: () => void }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [full, setFull] = useState<any>(null);
  const [open, setOpen] = useState<any>(null);
  const [awards, setAwards] = useState<Record<string, string>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [term, setTerm] = useState('TERM_1');
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(() => {
    teacherAPI
      .getTestAttempts(test._id)
      .then((r) => {
        setRows(r.data.data.rows);
        setFull(r.data.data.test);
      })
      .catch(() => toast.error('Could not load submissions'));
  }, [test._id]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const stats = useMemo(() => {
    const done = (rows ?? []).filter((r) => r.attempt && r.attempt.status !== 'IN_PROGRESS');
    const scored = done.filter((r) => typeof r.attempt.score === 'number');
    return {
      total: rows?.length ?? 0,
      sat: done.length,
      toMark: done.filter((r) => r.attempt.status === 'SUBMITTED').length,
      average: scored.length ? Math.round((scored.reduce((s, r) => s + r.attempt.score, 0) / scored.length) * 10) / 10 : null,
    };
  }, [rows]);

  const openAttempt = (row: any) => {
    setOpen(row);
    const init: Record<string, string> = {};
    for (const a of row.attempt?.answers ?? []) if (a.awarded !== undefined && a.awarded !== null) init[a.questionId] = String(a.awarded);
    setAwards(init);
  };

  const saveMarks = async () => {
    setSavingMarks(true);
    try {
      const payload = Object.fromEntries(Object.entries(awards).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]));
      await teacherAPI.markAttempt(open.attempt._id, payload);
      toast.success('Marks saved');
      setOpen(null);
      load();
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the marks'));
    } finally {
      setSavingMarks(false);
    }
  };

  const publishResults = async () => {
    setPublishing(true);
    try {
      await teacherAPI.publishTestResults(test._id, { term });
      toast.success('Results published — students and guardians can see them');
      onChanged();
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not publish results'));
    } finally {
      setPublishing(false);
    }
  };

  if (!rows) return <Skeleton className="h-64 w-full rounded-[18px]" />;
  const closed = new Date(test.closesAt).getTime() <= Date.now();
  const total = full?.totalMarks ?? test.totalMarks;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Handed in" value={`${stats.sat} / ${stats.total}`} />
        <Tile label="Average" value={stats.average !== null ? `${stats.average} / ${total}` : '—'} />
        <Tile label="To mark" value={String(stats.toMark)} warn={stats.toMark > 0} />
        <Tile label="Results" value={test.resultsPublished ? 'Published' : 'Not yet'} />
      </div>

      <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center">
        <Award className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
        <p className="flex-1 text-dense text-ink-muted">
          {!closed
            ? 'You can publish results once the test has closed.'
            : stats.toMark
              ? 'Mark every short answer, then publish the results.'
              : test.resultsPublished
                ? 'Results are on students’ Results pages. Publishing again updates them after re-marking.'
                : 'Publishing adds each score to the class results. Students who didn’t sit it are recorded as absent.'}
        </p>
        <div className="w-36">
          <Combobox
            options={[
              { value: 'TERM_1', label: 'Term 1' },
              { value: 'TERM_2', label: 'Term 2' },
              { value: 'FINAL', label: 'Final' },
            ]}
            value={term}
            onChange={setTerm}
          />
        </div>
        <Button onClick={publishResults} loading={publishing} disabled={!closed || stats.toMark > 0}>
          {test.resultsPublished ? 'Publish again' : 'Publish results'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
        <table className="w-full text-dense">
          <thead className="bg-surface-sunken text-meta text-ink-muted">
            <tr>
              <th className="w-16 px-4 py-2.5 text-left font-semibold">Roll</th>
              <th className="px-4 py-2.5 text-left font-semibold">Student</th>
              <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              <th className="hidden px-4 py-2.5 text-left font-semibold md:table-cell">Handed in</th>
              <th className="px-4 py-2.5 text-right font-semibold">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const a = r.attempt;
              const meta = ATTEMPT_META[a?.status ?? 'NONE'];
              return (
                <tr
                  key={r.student._id}
                  onClick={() => a && a.status !== 'IN_PROGRESS' && openAttempt(r)}
                  className={cn(a && a.status !== 'IN_PROGRESS' && 'cursor-pointer hover:bg-wash/50')}
                >
                  <td className="px-4 py-2.5 text-ink-muted tabular">{r.student.rollNumber || rows.indexOf(r) + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{r.student.fullName}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-meta font-medium', meta.tone)}>{meta.label}</span>
                    {a?.autoSubmitted && <span className="ml-2 text-meta text-ink-subtle">time ran out</span>}
                  </td>
                  <td className="hidden px-4 py-2.5 text-ink-muted md:table-cell">{a?.submittedAt ? fmtWhen(a.submittedAt) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {typeof a?.score === 'number' && a.status !== 'IN_PROGRESS' ? (
                      <span className="font-semibold text-ink">
                        {a.score}
                        <span className="font-normal text-ink-subtle"> / {total}</span>
                      </span>
                    ) : (
                      <span className="text-ink-subtle">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{open?.student.fullName}</SheetTitle>
            <SheetDescription>
              {open?.attempt?.status === 'SUBMITTED' ? 'Mark the short answers.' : 'Their answers.'} Score so far:{' '}
              {open?.attempt?.score ?? 0} / {total}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            {(full?.questions ?? []).map((q: any, i: number) => {
              const ans = open?.attempt?.answers?.find((a: any) => String(a.questionId) === String(q._id));
              return (
                <div key={q._id} className="rounded-xl border border-line p-3">
                  <p className="text-meta font-semibold text-ink-subtle">
                    Question {i + 1} · {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </p>
                  <p className="mt-1 text-dense text-ink">{q.text}</p>
                  {q.kind === 'MCQ' ? (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o: string, oi: number) => {
                        const chosen = ans?.option === oi;
                        const right = q.correctOption === oi;
                        return (
                          <li
                            key={oi}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-2 py-1 text-dense',
                              right ? 'bg-success-bg text-success' : chosen ? 'bg-danger-bg text-danger' : 'text-ink-muted'
                            )}
                          >
                            <span className="w-4 font-semibold">{LETTERS[oi]}</span>
                            {o}
                            {chosen && <span className="ml-auto text-meta font-semibold">their answer</span>}
                          </li>
                        );
                      })}
                      {ans?.option === undefined && <li className="text-meta text-ink-subtle">Not answered</li>}
                    </ul>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <p className="whitespace-pre-wrap rounded-lg bg-surface-sunken px-3 py-2 text-dense text-ink">
                        {ans?.text?.trim() ? ans.text : <span className="text-ink-subtle">No answer</span>}
                      </p>
                      <label className="flex items-center gap-2 text-dense text-ink-muted">
                        Marks
                        <input
                          type="number"
                          min={0}
                          max={q.marks}
                          step={0.5}
                          value={awards[q._id] ?? ''}
                          onChange={(e) => setAwards((w) => ({ ...w, [q._id]: e.target.value }))}
                          className="h-8 w-20 rounded-chip border border-line bg-surface px-2 text-ink tabular focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                        />
                        <span className="text-ink-subtle">/ {q.marks}</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </SheetBody>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setOpen(null)}>
              Close
            </Button>
            {(full?.questions ?? []).some((q: any) => q.kind === 'SHORT') && (
              <Button onClick={saveMarks} loading={savingMarks}>
                Save marks
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Tile({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-4 shadow-card">
      <p className="text-meta text-ink-subtle">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular', warn ? 'text-warning' : 'text-ink')}>{value}</p>
    </div>
  );
}
