'use client';

import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Minus, Plus, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Copied into /public by the postinstall script, so it always matches the
// pdf.js version react-pdf was built against.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const ZOOMS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Renders one page at a time, at the width of the screen. Phones can't show
 * a PDF inside a page with the browser's own viewer, and most students read
 * on a phone — so the book is drawn here with pdf.js instead. Large books
 * stream in ranges: page 120 opens without downloading pages 1–119 first.
 */
export default function PdfReader({
  url,
  initialPage = 1,
  onPageChange,
  className,
}: {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}) {
  const [numPages, setNumPages] = React.useState(0);
  const [page, setPage] = React.useState(initialPage);
  const [zoom, setZoom] = React.useState(1);
  const [width, setWidth] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const [pageInput, setPageInput] = React.useState(String(initialPage));
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Same object across renders, or react-pdf reloads the whole document.
  const file = React.useMemo(() => ({ url, withCredentials: true }), [url]);
  const options = React.useMemo(() => ({ disableAutoFetch: true, disableStream: false }), []);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A citation link can open the reader at a new page while it's mounted.
  React.useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  const goTo = React.useCallback(
    (n: number) => {
      const next = Math.max(1, Math.min(numPages || n, n));
      setPage(next);
      onPageChange?.(next);
      viewportRef.current?.scrollTo({ top: 0 });
    },
    [numPages, onPageChange]
  );

  React.useEffect(() => setPageInput(String(page)), [page]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(page + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, page]);

  const pageWidth = width ? Math.min(width - 16, 900) * zoom : undefined;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = parseInt(pageInput, 10);
              if (!Number.isNaN(n)) goTo(n);
            }}
            className="flex items-center gap-1.5 text-dense text-ink-muted"
          >
            <label htmlFor="reader-page" className="sr-only">
              Page number
            </label>
            <input
              id="reader-page"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
              onBlur={() => setPageInput(String(page))}
              className="h-7 w-12 rounded-chip border border-line bg-surface text-center text-dense text-ink tabular focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
            <span className="tabular">of {numPages || '…'}</span>
          </form>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goTo(page + 1)}
            disabled={!numPages || page >= numPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])}
            disabled={zoom === ZOOMS[0]}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <span className="w-11 text-center text-meta text-ink-muted tabular">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])}
            disabled={zoom === ZOOMS[ZOOMS.length - 1]}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={`${url}#page=${page}`} target="_blank" rel="noreferrer" aria-label="Open the PDF in a new tab">
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </Button>
        </div>
      </div>

      <div ref={viewportRef} className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-surface-sunken p-2">
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle className="h-5 w-5 text-danger" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-dense font-medium text-ink">This book could not be opened</p>
            <p className="max-w-sm text-dense text-ink-muted">
              The file may be missing or damaged. Try opening it in a new tab, or tell the school office.
            </p>
          </div>
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              if (page > n) goTo(n);
            }}
            onLoadError={() => setFailed(true)}
            loading={<ReaderSkeleton />}
            error={<span />}
            // w-fit + mx-auto rather than flex centring: a zoomed page wider
            // than the screen must still scroll to its left edge.
            className="mx-auto w-fit"
          >
            {pageWidth ? (
              <Page
                key={`${page}-${pageWidth}`}
                pageNumber={page}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<ReaderSkeleton />}
                className="overflow-hidden rounded-sm shadow-card"
              />
            ) : null}
          </Document>
        )}
      </div>
    </div>
  );
}

function ReaderSkeleton() {
  return <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-[900px] rounded-sm" />;
}
