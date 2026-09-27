'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Timer, Send, Check, CheckCircle2, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiErrorMessage, cn } from '@/lib/utils';
import { formatClock } from '@/lib/design/classTests';
import { t as tr } from '@/lib/i18n';

const LETTERS = 'ABCDEF';
const hasBangla = (t?: string) => !!t && /[ঀ-৿]/.test(t);

export default function StudentTestRoute() {
  return (
    <Suspense>
      <StudentTestPage />
    </Suspense>
  );
}

function StudentTestPage() {
  const { id } = useParams<{ id: string }>();
  const view = useSearchParams().get('view');
  return view === 'result' ? <ResultView id={id} /> : <TakeTest id={id} />;
}

// ── Before starting: what the test is, and a Start button ─────────────────

function TakeTest({ id }: { id: string }) {
  const [intro, setIntro] = useState<any>(null);
  const [paper, setPaper] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    studentAPI
      .getTests()
      .then((r) => {
        const t = (r.data.data ?? []).find((x: any) => x._id === id);
        if (!t) setError(tr('This test isn’t available to you.'));
        else setIntro(t);
        // Mid-test (a reload, or coming back): go straight back in.
        if (t?.attempt?.status === 'IN_PROGRESS') start();
      })
      .catch((err) => setError(apiErrorMessage(err, tr('This test did not load.'))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const start = async () => {
    setStarting(true);
    try {
      const r = await studentAPI.startTest(id);
      setPaper(r.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, tr('Could not start the test')));
    } finally {
      setStarting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState title={tr('Can’t open this test')} description={error} />
      </div>
    );
  }
  if (paper) return <Sitting id={id} paper={paper} />;
  if (!intro) return <Skeleton className="mx-auto h-72 w-full max-w-2xl rounded-[18px]" />;

  const handedIn = intro.attempt && intro.attempt.status !== 'IN_PROGRESS';
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackLink />
      <div className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-card">
        <div className="bg-brand px-6 py-6 text-brand-contrast sm:px-8">
          <p className="text-meta font-semibold uppercase tracking-[0.14em] opacity-80">{tr('{name} · Class test', { name: intro.subjectId?.name })}</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{intro.title}</h1>
          {intro.teacher?.fullName && <p className="mt-1 text-dense opacity-85">{tr('Set by {fullName}', { fullName: intro.teacher.fullName })}</p>}
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Fact label={tr('Time limit')} value={`${intro.durationMinutes} min`} />
            <Fact label={tr('Questions')} value={String(intro.questionCount)} />
            <Fact label={tr('Marks')} value={String(intro.totalMarks)} />
          </dl>
          {intro.instructions && (
            <p className={cn('whitespace-pre-wrap rounded-xl bg-surface-sunken px-4 py-3 text-body text-ink', hasBangla(intro.instructions) && 'font-bn')}>
              {intro.instructions}
            </p>
          )}
          <ul className="space-y-1.5 text-dense text-ink-muted">
            <li>{tr('• The timer starts when you press Start and keeps running if you leave the page.')}</li>
            <li>{tr('• Your answers save automatically as you go.')}</li>
            <li>{tr('• When time is up, your saved answers are handed in for you.')}</li>
          </ul>
          {handedIn ? (
            <p className="flex items-center gap-2 rounded-xl bg-success-bg px-4 py-3 text-dense text-success">
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {tr('You have handed this test in.')}
            </p>
          ) : (
            <Button size="lg" className="w-full" onClick={start} loading={starting}>
              <PlayCircle className="h-5 w-5" strokeWidth={1.75} />
              {tr('Start — {durationMinutes} minutes', { durationMinutes: intro.durationMinutes })}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sitting the test: timer, questions, autosave, hand in ──────────────────

function Sitting({ id, paper }: { id: string; paper: any }) {
  const questions: any[] = paper.test.questions;
  // The server's clock decides; correct for any difference with this device.
  const offset = useMemo(() => new Date(paper.serverTime).getTime() - Date.now(), [paper.serverTime]);
  const deadline = new Date(paper.attempt.deadline).getTime();

  const [answers, setAnswers] = useState<Record<string, { option?: number; text?: string }>>(() =>
    Object.fromEntries((paper.attempt.answers ?? []).map((a: any) => [a.questionId, { option: a.option, text: a.text }]))
  );
  const [remaining, setRemaining] = useState(deadline - (Date.now() + offset));
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [done, setDone] = useState<null | { auto: boolean }>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const dirtyRef = useRef(false);
  const finishing = useRef(false);

  const asList = () =>
    Object.entries(answersRef.current).map(([questionId, a]) => ({ questionId, option: a.option, text: a.text }));

  const persist = useCallback(async () => {
    if (!dirtyRef.current || finishing.current) return;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      await studentAPI.saveTestAnswers(id, asList());
      setSaveState('saved');
    } catch {
      dirtyRef.current = true;
      setSaveState('error');
    }
  }, [id]);

  const finish = useCallback(
    async (auto: boolean) => {
      if (finishing.current) return;
      finishing.current = true;
      setSubmitting(true);
      try {
        await studentAPI.submitTest(id, asList());
      } catch {
        // Past the deadline the server has already handed in what was saved.
      }
      setDone({ auto });
      setSubmitting(false);
    },
    [id]
  );

  // The clock.
  useEffect(() => {
    const tick = () => {
      const left = deadline - (Date.now() + offset);
      setRemaining(left);
      if (left <= 0) finish(true);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [deadline, offset, finish]);

  // Autosave: shortly after each change, and every 15 seconds regardless.
  useEffect(() => {
    if (saveState !== 'unsaved') return;
    const t = setTimeout(persist, 1500);
    return () => clearTimeout(t);
  }, [answers, saveState, persist]);
  useEffect(() => {
    const t = setInterval(persist, 15_000);
    return () => clearInterval(t);
  }, [persist]);

  useEffect(() => {
    if (done) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [done]);

  const answer = (qid: string, patch: { option?: number; text?: string }) => {
    setAnswers((a) => ({ ...a, [qid]: { ...a[qid], ...patch } }));
    dirtyRef.current = true;
    setSaveState('unsaved');
  };

  const answered = questions.filter((q) => {
    const a = answers[q._id];
    return q.kind === 'MCQ' ? a?.option !== undefined && a?.option !== null : !!a?.text?.trim();
  }).length;

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-5 pt-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-ink">{done.auto ? tr('Time’s up — handed in') : tr('Handed in')}</h1>
        <p className="text-body text-ink-muted">
          {done.auto ? tr('Your saved answers were handed in when the timer reached zero. ') : ''}
          {tr('You answered {answered} of {length} questions. Your result appears once your teacher publishes it.', { answered, length: questions.length })}
        </p>
        <Button asChild>
          <Link href="/student/tests">{tr('Back to class tests')}</Link>
        </Button>
      </div>
    );
  }

  const urgent = remaining < 60_000;
  const warning = remaining < 5 * 60_000;
  const pct = Math.max(0, Math.min(100, (remaining / (paper.test.durationMinutes * 60_000)) * 100));

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      {/* The clock stays in view the whole time. */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[18px] sm:border sm:bg-surface sm:shadow-card">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-dense font-semibold text-ink">{paper.test.title}</p>
            <p className="flex items-center gap-2 text-meta text-ink-muted">
              <span className="tabular">
                {tr('{answered} / {length} answered', { answered, length: questions.length })}
              </span>
              <SaveIndicator state={saveState} />
            </p>
          </div>
          <div
            role="timer"
            aria-live={urgent ? 'assertive' : 'off'}
            aria-label={tr('Time left {formatClock}', { formatClock: formatClock(remaining) })}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold tabular transition-colors',
              urgent ? 'animate-pulse bg-danger text-white' : warning ? 'bg-warning-bg text-warning' : 'bg-brand-wash text-brand'
            )}
          >
            <Timer className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            {formatClock(remaining)}
          </div>
          <Button onClick={() => setConfirming(true)} className="hidden sm:inline-flex">
            <Send className="h-4 w-4" strokeWidth={1.75} />
            {tr('Hand in')}
          </Button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', urgent ? 'bg-danger' : warning ? 'bg-warning' : 'bg-brand')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {questions.map((q, i) => {
        const a = answers[q._id] ?? {};
        return (
          <section key={q._id} className="rounded-[18px] border border-line bg-surface p-5 shadow-card sm:p-6" aria-labelledby={`q-${q._id}`}>
            <div className="flex items-start justify-between gap-3">
              <p id={`q-${q._id}`} className={cn('text-body font-medium text-ink', hasBangla(q.text) && 'font-bn leading-[1.75]')}>
                <span className="mr-2 text-ink-subtle tabular">{i + 1}.</span>
                {q.text}
              </p>
              <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-meta text-ink-muted">
                {q.marks} {q.marks === 1 ? tr('mark') : tr('marks')}
              </span>
            </div>
            {q.kind === 'MCQ' ? (
              <div role="radiogroup" aria-labelledby={`q-${q._id}`} className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.options.map((o: string, oi: number) => {
                  const chosen = a.option === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      onClick={() => answer(q._id, { option: oi })}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-dense transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                        chosen ? 'border-brand bg-brand-wash text-ink' : 'border-line hover:border-line-strong hover:bg-wash/40'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-meta font-bold',
                          chosen ? 'bg-brand text-brand-contrast' : 'bg-surface-sunken text-ink-muted'
                        )}
                      >
                        {LETTERS[oi]}
                      </span>
                      <span className={cn(hasBangla(o) && 'font-bn')}>{o}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                className={cn('mt-4', hasBangla(a.text) && 'font-bn')}
                rows={4}
                value={a.text ?? ''}
                onChange={(e) => answer(q._id, { text: e.target.value })}
                placeholder={tr('Write your answer…')}
                aria-label={tr('Answer to question {value}', { value: i + 1 })}
              />
            )}
          </section>
        );
      })}

      <div className="flex justify-center">
        <Button size="lg" onClick={() => setConfirming(true)}>
          <Send className="h-4 w-4" strokeWidth={1.75} />
          {tr('Hand in')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={tr('Hand in your test?')}
        description={
          answered < questions.length
            ? tr('You have answered {answered} of {length} questions. You can’t change your answers after handing in.', { answered, length: questions.length })
            : tr('You’ve answered every question. You can’t change your answers after handing in.')
        }
        confirmLabel={tr('Hand in')}
        loading={submitting}
        onConfirm={() => finish(false)}
      />
    </div>
  );
}

function SaveIndicator({ state }: { state: 'saved' | 'saving' | 'unsaved' | 'error' }) {
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-danger">
        <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
        {tr('Not saved — check your connection')}
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <Check className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
        {tr('Saved')}
      </span>
    );
  }
  return <span className="text-ink-subtle">{tr('Saving…')}</span>;
}

// ── The marked paper ───────────────────────────────────────────────────────

function ResultView({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentAPI
      .getTestResult(id)
      .then((r) => setData(r.data.data))
      .catch((err) => setError(apiErrorMessage(err, tr('The result did not load.'))));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState description={error} />
      </div>
    );
  }
  if (!data) return <Skeleton className="mx-auto h-72 w-full max-w-3xl rounded-[18px]" />;

  const score = data.attempt?.score ?? 0;
  const total = data.test.totalMarks || 1;
  const pct = Math.round((score / total) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink />
      <div className="flex flex-wrap items-center gap-5 rounded-[22px] border border-line bg-surface p-6 shadow-card">
        <div
          className={cn(
            'flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full text-center',
            pct >= 80 ? 'bg-success-bg text-success' : pct >= 50 ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger'
          )}
        >
          <span className="text-2xl font-bold tabular">{score}</span>
          <span className="text-meta">{tr('of {totalMarks}', { totalMarks: data.test.totalMarks })}</span>
        </div>
        <div className="min-w-0">
          <p className="text-meta font-semibold uppercase tracking-[0.14em] text-ink-subtle">{data.test.subjectId?.name}</p>
          <h1 className="text-2xl font-bold text-ink">{data.test.title}</h1>
          <p className="text-body text-ink-muted">
            {data.attempt ? `${pct}%${data.attempt.autoSubmitted ? ' · handed in when time ran out' : ''}` : tr('You didn’t sit this test.')}
          </p>
        </div>
      </div>

      {data.questions.map((q: any, i: number) => {
        const full = q.awarded >= q.marks && q.marks > 0;
        return (
          <section key={q._id} className="rounded-[18px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <p className={cn('text-body font-medium text-ink', hasBangla(q.text) && 'font-bn')}>
                <span className="mr-2 text-ink-subtle tabular">{i + 1}.</span>
                {q.text}
              </p>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-meta font-semibold tabular',
                  full ? 'bg-success-bg text-success' : q.awarded > 0 ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger'
                )}
              >
                {full ? <CheckCircle2 className="h-3 w-3" strokeWidth={2} /> : <XCircle className="h-3 w-3" strokeWidth={2} />}
                {q.awarded} / {q.marks}
              </span>
            </div>
            {q.kind === 'MCQ' ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o: string, oi: number) => {
                  const right = q.correctOption === oi;
                  const mine = q.yourOption === oi;
                  return (
                    <li
                      key={oi}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-3 py-2 text-dense',
                        right ? 'border-success/40 bg-success-bg text-success' : mine ? 'border-danger/40 bg-danger-bg text-danger' : 'border-line text-ink-muted'
                      )}
                    >
                      <span className="font-bold">{LETTERS[oi]}</span>
                      <span className="flex-1">{o}</span>
                      {mine && <span className="text-meta font-semibold">{tr('your answer')}</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-sunken px-3 py-2 text-dense text-ink">
                {q.yourText?.trim() ? q.yourText : <span className="text-ink-subtle">{tr('No answer')}</span>}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-sunken px-2 py-3">
      <dt className="text-meta text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-ink tabular">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/student/tests">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {tr('Class tests')}
      </Link>
    </Button>
  );
}
