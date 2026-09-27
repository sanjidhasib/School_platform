'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookMarked, Check } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { subjectTint } from '@/lib/design/subjects';
import { HOMEWORK_TYPES, homeworkType, type HomeworkType } from '@/lib/design/homework';

type Filter = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

const submissionStatus = (hw: any): string => hw?.submission?.status ?? 'NOT_SUBMITTED';
const isOverdue = (hw: any) =>
  hw?.dueAt && new Date(hw.dueAt) < new Date() && submissionStatus(hw) === 'NOT_SUBMITTED';

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [kind, setKind] = useState<HomeworkType | 'ALL'>('ALL');

  const [selected, setSelected] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getHomework()
      .then((r) => setHomeworks(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your homework');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // The kind filter narrows the list first; the status tabs count within it.
  const ofKind = useMemo(
    () => (kind === 'ALL' ? homeworks : homeworks.filter((h) => (h.type ?? 'HOMEWORK') === kind)),
    [homeworks, kind]
  );

  const counts = useMemo(
    () => ({
      all: ofKind.length,
      pending: ofKind.filter((h) => submissionStatus(h) === 'NOT_SUBMITTED' && !isOverdue(h)).length,
      submitted: ofKind.filter((h) => ['SUBMITTED', 'LATE'].includes(submissionStatus(h))).length,
      graded: ofKind.filter((h) => submissionStatus(h) === 'GRADED').length,
      overdue: ofKind.filter(isOverdue).length,
    }),
    [ofKind]
  );

  const visible = useMemo(() => {
    switch (filter) {
      case 'pending':
        return ofKind.filter((h) => submissionStatus(h) === 'NOT_SUBMITTED' && !isOverdue(h));
      case 'submitted':
        return ofKind.filter((h) => ['SUBMITTED', 'LATE'].includes(submissionStatus(h)));
      case 'graded':
        return ofKind.filter((h) => submissionStatus(h) === 'GRADED');
      case 'overdue':
        return ofKind.filter(isOverdue);
      default:
        return ofKind;
    }
  }, [ofKind, filter]);

  const openHomework = (hw: any) => {
    setSelected(hw);
    setAnswer(hw.submission?.answerText ?? '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Write your answer before turning it in.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await studentAPI.submitHomework(selected._id, { answerText: answer });
      toast.success('Turned in');
      setSelected(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not turn in your work'));
    } finally {
      setSubmitting(false);
    }
  };

  const alreadySubmitted =
    selected && ['SUBMITTED', 'LATE', 'GRADED'].includes(submissionStatus(selected));

  return (
    <div className="space-y-5">
      <PageHeader title="Homework" />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of work">
        {([{ value: 'ALL', plural: 'Everything' }, ...HOMEWORK_TYPES] as { value: HomeworkType | 'ALL'; plural: string }[]).map((t) => {
          const n = t.value === 'ALL' ? homeworks.length : homeworks.filter((h) => (h.type ?? 'HOMEWORK') === t.value).length;
          return (
            <button
              key={t.value}
              type="button"
              aria-pressed={kind === t.value}
              onClick={() => setKind(t.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-dense font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                kind === t.value ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
              )}
            >
              {t.plural}
              <span className={cn('text-meta tabular', kind === t.value ? 'opacity-80' : 'text-ink-subtle')}>{n}</span>
            </button>
          );
        })}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {(
            [
              ['all', 'All'],
              ['pending', 'To do'],
              ['submitted', 'Turned in'],
              ['graded', 'Graded'],
              ['overdue', 'Overdue'],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <TabsTrigger key={value} value={value} indicatorId="homework-tabs">
              {label}
              {counts[value] > 0 && (
                <span className="ml-1.5 text-meta text-ink-subtle tabular">{counts[value]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="pt-5">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : failed ? (
            <ErrorState description="Your homework did not load." onRetry={load} />
          ) : !visible.length ? (
            <div className="rounded-card border border-line bg-surface shadow-card">
              <EmptyState
                icon={BookMarked}
                title={
                  filter === 'overdue'
                    ? 'Nothing overdue'
                    : filter === 'pending'
                      ? 'Nothing to do'
                      : filter === 'graded'
                        ? 'Nothing graded yet'
                        : filter === 'submitted'
                          ? 'Nothing turned in yet'
                          : 'No homework set'
                }
                description={
                  filter === 'all'
                    ? 'Homework your teachers set will appear here.'
                    : 'Try another tab to see the rest of your homework.'
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
              {visible.map((hw: any) => {
                const status = submissionStatus(hw);
                const overdue = isOverdue(hw);
                const dueSoon =
                  !overdue &&
                  status === 'NOT_SUBMITTED' &&
                  hw.dueAt &&
                  new Date(hw.dueAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

                return (
                  <li key={hw._id}>
                    <button
                      type="button"
                      onClick={() => openHomework(hw)}
                      className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-wash/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                    >
                      <span
                        className={cn('h-10 w-1 shrink-0 rounded-full', subjectTint(hw.subjectId))}
                        aria-hidden="true"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-dense font-medium text-ink">{hw.title}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-meta font-medium', homeworkType(hw.type).tone)}>
                            {homeworkType(hw.type).label}
                          </span>
                          {!overdue && <StatusPill status={status} />}
                          {overdue && <Badge tone="danger">Overdue</Badge>}
                          {dueSoon && <Badge tone="warning">Due soon</Badge>}
                        </span>
                        <span className="mt-1 block">
                          <SubjectLabel
                            subject={hw.subjectId}
                            className="text-meta text-ink-muted"
                            inline
                          />
                        </span>
                        {hw.submission?.marks !== undefined && hw.submission?.marks !== null && (
                          <span className="mt-1 block text-meta font-medium text-success tabular">
                            {hw.submission.marks} out of {hw.maxMarks}
                          </span>
                        )}
                      </span>

                      <span className="shrink-0 text-right">
                        <span className="block text-meta text-ink-subtle">Due</span>
                        <span
                          className={cn(
                            'block text-dense tabular',
                            overdue ? 'font-medium text-danger' : 'text-ink'
                          )}
                        >
                          {formatDate(hw.dueAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
            <SheetDescription>
              <SubjectLabel subject={selected?.subjectId} inline /> · due {formatDate(selected?.dueAt)}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {selected?.description && (
                <div>
                  <p className="mb-1 text-meta font-medium text-ink-subtle">What to do</p>
                  <p className="whitespace-pre-line text-body text-ink">{selected.description}</p>
                </div>
              )}

              <dl className="flex flex-wrap gap-x-8 gap-y-2 border-y border-line py-3">
                <div>
                  <dt className="text-meta text-ink-subtle">Status</dt>
                  <dd className="mt-1">
                    <StatusPill status={submissionStatus(selected)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-subtle">Out of</dt>
                  <dd className="mt-1 text-dense text-ink tabular">{selected?.maxMarks}</dd>
                </div>
                {selected?.submission?.submittedAt && (
                  <div>
                    <dt className="text-meta text-ink-subtle">Turned in</dt>
                    <dd className="mt-1 text-dense text-ink">
                      {formatRelativeTime(selected.submission.submittedAt)}
                    </dd>
                  </div>
                )}
              </dl>

              {submissionStatus(selected) === 'GRADED' ? (
                <div className="space-y-3">
                  <div className="rounded-card border border-success/30 bg-success-bg p-4">
                    <p className="text-meta text-success">Your marks</p>
                    <p className="mt-0.5 text-2xl font-semibold text-success tabular">
                      {selected.submission.marks} <span className="text-body">/ {selected.maxMarks}</span>
                    </p>
                  </div>
                  {selected.submission?.feedback && (
                    <div>
                      <p className="mb-1 text-meta font-medium text-ink-subtle">Feedback</p>
                      <p className="whitespace-pre-line text-body text-ink">
                        {selected.submission.feedback}
                      </p>
                    </div>
                  )}
                  {selected.submission?.answerText && (
                    <div>
                      <p className="mb-1 text-meta font-medium text-ink-subtle">What you handed in</p>
                      <p className="whitespace-pre-line rounded-card border border-line bg-surface-sunken p-3 text-dense text-ink">
                        {selected.submission.answerText}
                      </p>
                    </div>
                  )}
                </div>
              ) : alreadySubmitted ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 rounded-card border border-success/30 bg-success-bg px-3 py-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                    <p className="text-dense text-success">
                      Turned in. You can replace your answer until your teacher grades it.
                    </p>
                  </div>
                  <Field label="Your answer" error={error}>
                    {(p) => (
                      <Textarea
                        {...p}
                        rows={8}
                        value={answer}
                        onChange={(e) => {
                          setAnswer(e.target.value);
                          setError(null);
                        }}
                      />
                    )}
                  </Field>
                </div>
              ) : (
                <Field label="Your answer" error={error} required>
                  {(p) => (
                    <Textarea
                      {...p}
                      rows={8}
                      value={answer}
                      onChange={(e) => {
                        setAnswer(e.target.value);
                        setError(null);
                      }}
                      placeholder="Write your answer here"
                    />
                  )}
                </Field>
              )}
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              {submissionStatus(selected) !== 'GRADED' && (
                <Button type="submit" loading={submitting}>
                  {alreadySubmitted ? 'Replace answer' : 'Turn in'}
                </Button>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
