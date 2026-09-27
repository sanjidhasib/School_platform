'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Library, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader, Section } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { subjectBn, subjectTint } from '@/lib/design/subjects';

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
        toast.error('Could not load your library');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // One shelf per subject, both language versions side by side.
  const shelves = useMemo(() => {
    const map = new Map<string, { subject: any; books: any[] }>();
    for (const b of data?.books ?? []) {
      const key = b.subjectId?._id ?? 'other';
      if (!map.has(key)) map.set(key, { subject: b.subjectId, books: [] });
      map.get(key)!.books.push(b);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    );
  }, [data]);

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

  if (failed) return <ErrorState description="Your library did not load." onRetry={load} />;

  const cls = data?.class;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Library"
        description={
          cls ? `NCTB textbooks for ${cls.name}${cls.section ? ` ${cls.section}` : ''}.` : undefined
        }
      />

      {!shelves.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Library}
            title="No books in your library yet"
            description="Your class's NCTB textbooks appear here once the school adds them."
          />
        </div>
      ) : (
        shelves.map(({ subject, books }) => (
          <Section
            key={subject?._id ?? 'other'}
            title={subject?.name ?? 'Other books'}
            description={subjectBn(subject) ?? undefined}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <BookCard key={b._id} book={b} />
              ))}
            </div>
          </Section>
        ))
      )}
    </div>
  );
}

function BookCard({ book }: { book: any }) {
  const bangla = book.language === 'BN';
  return (
    <Link
      href={`/student/library/${book._id}`}
      className={cn(
        'group flex overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all',
        'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
      )}
    >
      {/* The spine: the subject's own colour, same as everywhere else. */}
      <span className={cn('w-2.5 shrink-0', subjectTint(book.subjectId))} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="line-clamp-2 text-dense font-medium text-ink group-hover:text-brand">
            {book.title}
          </p>
          {book.edition && <p className="text-meta text-ink-subtle">{book.edition}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <Badge tone="outline" lang={bangla ? 'bn' : undefined} className={cn(bangla && 'font-bn')}>
            {bangla ? 'বাংলা ভার্সন' : 'English version'}
          </Badge>
          {book.pageCount > 0 && (
            <span className="text-meta text-ink-subtle tabular">{book.pageCount} pages</span>
          )}
          {book.status === 'COMPLETED' && book.textStatus === 'OK' && (
            <span
              className="ml-auto inline-flex items-center gap-1 text-meta text-ink-muted"
              title="The AI study helper can answer from this book"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} aria-hidden="true" />
              AI ready
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
