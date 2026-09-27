'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { studentAPI } from '@/lib/api/student';
import { ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiErrorMessage, cn } from '@/lib/utils';

// pdf.js touches browser-only APIs, so the reader never renders on the server.
const PdfReader = dynamic(() => import('@/components/shared/PdfReader'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export default function StudentBookRoute() {
  return (
    <Suspense>
      <StudentBookPage />
    </Suspense>
  );
}

function StudentBookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialPage = Math.max(1, parseInt(search.get('page') ?? '1', 10) || 1);

  const [book, setBook] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    studentAPI
      .getTextbook(id)
      .then((r) => setBook(r.data.data))
      .catch((err) => setError(apiErrorMessage(err, 'This book did not load.')));
  }, [id]);

  useEffect(load, [load]);

  // Keep the page in the URL so reloading or sharing reopens the same spot,
  // without adding a history entry for every page turned.
  const onPageChange = useCallback(
    (page: number) => router.replace(`/student/library/${id}?page=${page}`, { scroll: false }),
    [id, router]
  );

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState description={error} onRetry={load} />
      </div>
    );
  }

  const bangla = book?.language === 'BN';

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-3 lg:h-[calc(100dvh-7rem)]">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <BackLink />
        {book ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-section text-ink">{book.title}</h1>
            {/* The default title already names the version; the badge is for
                custom titles, and only where there's room for it. */}
            {!/version/i.test(book.title) && (
              <Badge
                tone="outline"
                lang={bangla ? 'bn' : undefined}
                className={cn('hidden shrink-0 sm:inline-flex', bangla && 'font-bn')}
              >
                {bangla ? 'বাংলা ভার্সন' : 'English version'}
              </Badge>
            )}
          </div>
        ) : (
          <Skeleton className="h-6 min-w-0 flex-1 sm:max-w-64" />
        )}
        {book?.status === 'COMPLETED' && book?.textStatus === 'OK' && (
          <Button variant="secondary" size="sm" asChild className="shrink-0">
            <Link
              href={`/student/ai-learning?subject=${book.subjectId?._id ?? ''}`}
              aria-label="Ask the AI about this book"
            >
              <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Ask the AI about this book</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <PdfReader
          url={studentAPI.textbookFileUrl(id)}
          initialPage={initialPage}
          onPageChange={onPageChange}
          className="h-full"
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/student/library">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Library
      </Link>
    </Button>
  );
}
