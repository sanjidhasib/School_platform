'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Timer, ListChecks, Clock, CheckCircle2, PlayCircle, Award, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';
import { fmtWhen } from '@/lib/design/classTests';

type State = 'UPCOMING' | 'OPEN' | 'IN_PROGRESS' | 'HANDED_IN' | 'RESULT' | 'MISSED';

function stateOf(t: any, now: number): State {
  const a = t.attempt;
  if (t.resultsPublished && a) return 'RESULT';
  if (a?.status === 'IN_PROGRESS' && new Date(a.deadline).getTime() > now) return 'IN_PROGRESS';
  if (a) return 'HANDED_IN';
  if (now < new Date(t.opensAt).getTime()) return 'UPCOMING';
  if (now < new Date(t.closesAt).getTime()) return 'OPEN';
  return 'MISSED';
}

const STATE_META: Record<State, { label: string; tone: string }> = {
  OPEN: { label: 'Open now', tone: 'bg-success-bg text-success' },
  IN_PROGRESS: { label: 'In progress', tone: 'bg-info-bg text-info' },
  UPCOMING: { label: 'Coming up', tone: 'bg-surface-sunken text-ink-muted' },
  HANDED_IN: { label: 'Handed in', tone: 'bg-brand-wash text-brand' },
  RESULT: { label: 'Result out', tone: 'bg-highlighter-wash text-warning' },
  MISSED: { label: 'Missed', tone: 'bg-danger-bg text-danger' },
};

const ORDER: State[] = ['IN_PROGRESS', 'OPEN', 'UPCOMING', 'RESULT', 'HANDED_IN', 'MISSED'];

export default function StudentTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getTests()
      .then((r) => setTests(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your tests');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);
  // Opening/closing times tick over without a reload.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...tests].sort((a, b) => ORDER.indexOf(stateOf(a, now)) - ORDER.indexOf(stateOf(b, now)));

  return (
    <div className="space-y-6">
      <PageHeader title="Class tests" description="Timed tests from your teachers. Once you start, the clock keeps running." />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[18px]" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState description="Your tests did not load." onRetry={load} />
      ) : !tests.length ? (
        <div className="rounded-[18px] border border-line bg-surface shadow-card">
          <EmptyState icon={Timer} title="No class tests yet" description="When a teacher sets a test for your class, it appears here." />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((t) => {
            const st = stateOf(t, now);
            const meta = STATE_META[st];
            return (
              <li key={t._id} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
                <span className={cn('h-1.5', subjectTint(t.subjectId))} aria-hidden="true" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-meta font-semibold', meta.tone)}>{meta.label}</span>
                    <span className="text-meta text-ink-subtle">{t.subjectId?.name}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-ink">{t.title}</p>
                    {t.teacher?.fullName && <p className="text-meta text-ink-muted">{t.teacher.fullName}</p>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {t.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {t.questionCount} questions · {t.totalMarks} marks
                    </span>
                  </div>
                  <p className="inline-flex items-center gap-1 text-meta text-ink-subtle">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {st === 'UPCOMING' ? `Opens ${fmtWhen(t.opensAt)}` : `Closes ${fmtWhen(t.closesAt)}`}
                  </p>

                  <div className="mt-auto pt-2">
                    {st === 'OPEN' && (
                      <Button asChild className="w-full">
                        <Link href={`/student/tests/${t._id}`}>
                          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
                          Start test
                        </Link>
                      </Button>
                    )}
                    {st === 'IN_PROGRESS' && (
                      <Button asChild className="w-full">
                        <Link href={`/student/tests/${t._id}`}>
                          <Hourglass className="h-4 w-4" strokeWidth={1.75} />
                          Continue — the clock is running
                        </Link>
                      </Button>
                    )}
                    {st === 'HANDED_IN' && (
                      <p className="flex items-center gap-2 rounded-xl bg-surface-sunken px-3 py-2 text-dense text-ink-muted">
                        <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} aria-hidden="true" />
                        Handed in — results come when your teacher publishes them.
                      </p>
                    )}
                    {st === 'RESULT' && (
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/student/tests/${t._id}?view=result`}>
                          <Award className="h-4 w-4" strokeWidth={1.75} />
                          {t.attempt?.score ?? 0} / {t.totalMarks} — see your paper
                        </Link>
                      </Button>
                    )}
                    {st === 'MISSED' && <p className="text-dense text-ink-subtle">This test closed before you started it.</p>}
                    {st === 'UPCOMING' && <p className="text-dense text-ink-subtle">You can start it once it opens.</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
