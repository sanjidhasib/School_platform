'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Library, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { subjectBn, subjectTint } from '@/lib/design/subjects';
import { t, num } from '@/lib/i18n';
import { tNode } from '@/lib/i18n/node';

export default function StudentLibraryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getTextbooks()
      .then((r) => setData(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load your library'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // One shelf for every subject the class studies — books or not — so the
  // library always shows the full set, and which ones are still to come.
  const shelves = useMemo(() => {
    const map = new Map<string, { subject: any; books: any[] }>();
    for (const s of data?.subjects ?? []) map.set(s._id, { subject: s, books: [] });
    for (const b of data?.books ?? []) {
      const key = b.subjectId?._id ?? 'other';
      if (!map.has(key)) map.set(key, { subject: b.subjectId, books: [] });
      map.get(key)!.books.push(b);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    );
  }, [data]);
  const available = shelves.filter((s) => s.books.length).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (failed) return <ErrorState description={t('Your library did not load.')} onRetry={load} />;

  const cls = data?.class;

  return (
    <div className="space-y-7">
      <PageHeader
        title={t('Library')}
        description={
          cls ? t('NCTB textbooks for {name}{value}.', { name: cls.name, value: cls.section ? ` ${cls.section}` : '' }) : undefined
        }
      />

      {!shelves.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Library}
            title={t('No books in your library yet')}
            description={t('Your class\'s NCTB textbooks appear here once the school adds them.')}
          />
        </div>
      ) : (
        <>
          <p className="text-dense text-ink-muted">
            {tNode('{available} of {total} subjects have their textbook here.', {
              available: <span className="font-semibold text-ink tabular">{num(available)}</span>,
              total: <span className="tabular">{num(shelves.length)}</span>,
            })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shelves.map(({ subject, books }) => (
              <SubjectShelf key={subject?._id ?? 'other'} subject={subject} books={books} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SubjectShelf({ subject, books }: { subject: any; books: any[] }) {
  const bn = subjectBn(subject);
  const ready = books.length > 0;
  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-[18px] border bg-surface shadow-card',
        ready ? 'border-line' : 'border-dashed border-line-strong bg-transparent shadow-none'
      )}
    >
      {/* The spine: the subject's own colour, same as everywhere else. */}
      <span className={cn('w-2.5 shrink-0', ready ? subjectTint(subject) : 'bg-line')} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              ready ? subjectTint(subject) : 'bg-surface-sunken'
            )}
          >
            <BookOpen className={cn('h-5 w-5', ready ? 'text-ink' : 'text-ink-subtle')} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-ink">{subject?.name ?? t('Other books')}</p>
            {bn && (
              <p lang="bn" className="truncate font-bn text-meta text-ink-muted">
                {bn}
              </p>
            )}
          </div>
        </div>

        {!ready ? (
          <p className="mt-auto text-meta text-ink-subtle">{t('Textbook not added yet.')}</p>
        ) : (
          <ul className="mt-auto space-y-2">
            {books.map((b) => {
              const bangla = b.language === 'BN';
              return (
                <li key={b._id}>
                  <Link
                    href={`/student/library/${b._id}`}
                    className="group flex items-center gap-2 rounded-xl border border-line px-3 py-2 transition-colors hover:border-brand/40 hover:bg-brand-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <span
                      lang={bangla ? 'bn' : undefined}
                      className={cn('flex-1 text-dense font-medium text-ink group-hover:text-brand', bangla && 'font-bn')}
                    >
                      {bangla ? 'বাংলা ভার্সন' : t('English version')}
                    </span>
                    {b.pageCount > 0 && <span className="text-meta text-ink-subtle tabular">{t('{pageCount} pages', { pageCount: b.pageCount })}</span>}
                    {b.status === 'COMPLETED' && b.textStatus === 'OK' && (
                      <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} aria-label={t('AI ready')} />
                    )}
                    <ArrowRight className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
