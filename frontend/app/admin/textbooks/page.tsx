'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Library,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Progress } from '@/components/ui/progress';
import {
  TableWrap,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { apiErrorMessage, cn } from '@/lib/utils';
import { subjectBn, subjectTint } from '@/lib/design/subjects';

const MAX_MB = 200;
const emptyForm = { classNumber: '', subjectId: '', language: 'BN' as 'BN' | 'EN', title: '', edition: '' };

const formatSize = (bytes?: number) =>
  !bytes ? '' : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

export default function AdminTextbooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [ai, setAi] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [classFilter, setClassFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback((quiet = false) => {
    if (!quiet) {
      setLoading(true);
      setFailed(false);
    }
    return adminAPI
      .getTextbooks()
      .then((r) => {
        setBooks(r.data.data ?? []);
        setAi(r.data.ai ?? null);
      })
      .catch(() => {
        if (!quiet) {
          setFailed(true);
          toast.error('Could not load textbooks');
        }
      })
      .finally(() => !quiet && setLoading(false));
  }, []);

  useEffect(() => {
    load();
    Promise.all([adminAPI.getClasses(), adminAPI.getSubjects()])
      .then(([c, s]) => {
        setClasses(c.data.data ?? []);
        setSubjects(s.data.data ?? []);
      })
      .catch(() => toast.error('Could not load classes and subjects'));
  }, [load]);

  // While any book is still being processed, check back every few seconds.
  const processing = books.some((b) => b.status === 'PROCESSING');
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(() => load(true), 3000);
    return () => clearInterval(t);
  }, [processing, load]);

  const gradeNumbers = useMemo(
    () => Array.from(new Set(classes.map((c) => c.gradeNumber).filter(Boolean))).sort((a, b) => a - b),
    [classes]
  );

  // Only the subjects actually taught in the chosen class.
  const subjectsForClass = useMemo(() => {
    if (!form.classNumber) return subjects;
    const ids = new Set(
      classes.filter((c) => String(c.gradeNumber) === form.classNumber).map((c) => String(c._id))
    );
    return subjects.filter((s) => (s.classIds ?? []).some((id: any) => ids.has(String(id?._id ?? id))));
  }, [subjects, classes, form.classNumber]);

  const visible = classFilter === 'all' ? books : books.filter((b) => String(b.classNumber) === classFilter);

  const openUpload = () => {
    setForm({ ...emptyForm, classNumber: classFilter === 'all' ? '' : classFilter });
    setFile(null);
    setProgress(0);
    setOpen(true);
  };

  const pickFile = (f?: File | null) => {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) {
      toast.error('Choose a PDF file');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`That file is larger than ${MAX_MB} MB`);
      return;
    }
    setFile(f);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classNumber || !form.subjectId || !file) {
      toast.error('Choose a class, a subject and a PDF');
      return;
    }
    const data = new FormData();
    data.append('classNumber', form.classNumber);
    data.append('subjectId', form.subjectId);
    data.append('language', form.language);
    if (form.title.trim()) data.append('title', form.title.trim());
    if (form.edition.trim()) data.append('edition', form.edition.trim());
    data.append('file', file);

    setUploading(true);
    setProgress(0);
    try {
      await adminAPI.uploadTextbook(data, setProgress);
      toast.success('Uploaded — the book is being processed');
      setOpen(false);
      load(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not upload the book'));
    } finally {
      setUploading(false);
    }
  };

  const reprocess = async (b: any) => {
    try {
      await adminAPI.reprocessTextbook(b._id);
      toast.success('Processing again');
      load(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not re-process the book'));
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteTextbook(deleting._id);
      toast.success('Textbook deleted');
      setDeleting(null);
      load(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the book'));
    } finally {
      setRemoving(false);
    }
  };

  const classOptions = gradeNumbers.map((n) => ({ value: String(n), label: `Class ${n}` }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Textbooks"
        description="NCTB books for each class. Students read them in their library, and the AI study helper answers from them."
        actions={
          <Button onClick={openUpload}>
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Upload a book
          </Button>
        }
      />

      {ai && !ai.available && (
        <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-bg px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden="true" />
          <div className="space-y-0.5 text-dense">
            <p className="font-medium text-ink">AI answers are switched off</p>
            <p className="text-ink-muted">
              {String(ai.reason ?? '').replace(/\.$/, '')}. Students still get the matching textbook pages. Put a valid key in{' '}
              <code className="rounded bg-surface px-1 text-meta">GEMINI_API_KEY</code> in{' '}
              <code className="rounded bg-surface px-1 text-meta">backend/.env</code>, restart the server, then
              re-process each book to switch on full answers and smarter search.
            </p>
          </div>
        </div>
      )}

      <div className="w-44">
        <Combobox
          options={[{ value: 'all', label: 'All classes' }, ...classOptions]}
          value={classFilter}
          onChange={setClassFilter}
          placeholder="All classes"
          searchPlaceholder="Find a class"
        />
      </div>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : failed ? (
        <ErrorState description="The textbook list did not load." onRetry={() => load()} />
      ) : !visible.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Library}
            title={books.length ? 'No books for this class yet' : 'No textbooks yet'}
            description="Upload the NCTB PDF for each subject — the Bangla version, the English version, or both."
            action={
              <Button onClick={openUpload}>
                <Upload className="h-4 w-4" strokeWidth={1.75} />
                Upload a book
              </Button>
            }
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Book</TableHead>
                <TableHead className="w-24">Class</TableHead>
                <TableHead className="hidden md:table-cell">Version</TableHead>
                <TableHead numeric className="hidden sm:table-cell">
                  Pages
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((b) => (
                <TableRow key={b._id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <span
                        className={cn('mt-0.5 h-9 w-1.5 shrink-0 rounded-full', subjectTint(b.subjectId))}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{b.title}</p>
                        <p className="truncate text-meta text-ink-subtle">
                          {[b.subjectId?.name, subjectBn(b.subjectId), b.edition, formatSize(b.fileSize)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink tabular">Class {b.classNumber}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {b.language === 'BN' ? (
                      <span lang="bn" className="font-bn text-ink-muted">
                        বাংলা ভার্সন
                      </span>
                    ) : (
                      <span className="text-ink-muted">English version</span>
                    )}
                  </TableCell>
                  <TableCell numeric className="hidden text-ink-muted sm:table-cell">
                    {b.pageCount || '—'}
                  </TableCell>
                  <TableCell>
                    <BookStatus book={b} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${b.title}`}>
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => window.open(adminAPI.textbookFileUrl(b._id), '_blank', 'noopener')}
                          >
                            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                            Open PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={b.status === 'PROCESSING'}
                            onSelect={() => reprocess(b)}
                          >
                            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                            Process again
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onSelect={() => setDeleting(b)}>
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}

      <Sheet open={open} onOpenChange={(o) => !uploading && setOpen(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Upload a textbook</SheetTitle>
            <SheetDescription>
              One PDF per subject and version. Download the official books from nctb.gov.bd.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUpload} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label="Class" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={classOptions}
                    value={form.classNumber}
                    onChange={(v) => setForm((f) => ({ ...f, classNumber: v, subjectId: '' }))}
                    placeholder="Choose a class"
                    searchPlaceholder="Find a class"
                  />
                )}
              </Field>

              <Field
                label="Subject"
                required
                description={form.classNumber ? `Subjects taught in Class ${form.classNumber}.` : undefined}
              >
                {(p) => (
                  <Combobox
                    {...p}
                    options={subjectsForClass.map((s) => ({
                      value: s._id,
                      label: s.name,
                      hint: subjectBn(s) ?? s.code,
                    }))}
                    value={form.subjectId}
                    onChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
                    placeholder="Choose a subject"
                    searchPlaceholder="Find a subject"
                  />
                )}
              </Field>

              <Field label="Version" required>
                {() => (
                  <div className="flex rounded-btn border border-line p-0.5" role="group" aria-label="Version">
                    {(['BN', 'EN'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        aria-pressed={form.language === lang}
                        onClick={() => setForm((f) => ({ ...f, language: lang }))}
                        lang={lang === 'BN' ? 'bn' : undefined}
                        className={cn(
                          'h-8 flex-1 rounded-chip text-dense font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                          lang === 'BN' && 'font-bn',
                          form.language === lang ? 'bg-wash text-brand' : 'text-ink-muted hover:text-ink'
                        )}
                      >
                        {lang === 'BN' ? 'বাংলা ভার্সন' : 'English version'}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="PDF file" required description={`Up to ${MAX_MB} MB.`}>
                {(p) => (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      'rounded-card border border-dashed px-4 py-5 text-center transition-colors',
                      dragging ? 'border-brand bg-brand-wash' : 'border-line-strong'
                    )}
                  >
                    <input
                      {...p}
                      ref={fileInput}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                    {file ? (
                      <div className="flex items-center gap-3 text-left">
                        <FileText className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-dense font-medium text-ink">{file.name}</p>
                          <p className="text-meta text-ink-subtle">{formatSize(file.size)}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-dense text-ink-muted">Drag the PDF here, or</p>
                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                          Choose a file
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Title" description="Optional. Leave empty to name it from the class and subject.">
                {(p) => (
                  <Input
                    {...p}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Science — Class 6 (Bangla version)"
                  />
                )}
              </Field>

              <Field label="Edition" description="Optional, e.g. the curriculum year.">
                {(p) => (
                  <Input
                    {...p}
                    value={form.edition}
                    onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))}
                    placeholder="2025"
                  />
                )}
              </Field>

              {uploading && (
                <div className="space-y-1.5">
                  <Progress value={progress} label="Upload progress" />
                  <p className="text-meta text-ink-subtle tabular">
                    {progress < 100 ? `Uploading… ${progress}%` : 'Saving…'}
                  </p>
                </div>
              )}
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" loading={uploading} disabled={!file || !form.classNumber || !form.subjectId}>
                Upload
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this textbook?"
        description={
          <>
            <strong className="text-ink">{deleting?.title}</strong> will be removed from the library, and the AI
            will stop answering from it.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/** Always an icon and a word, and the reason when something needs attention. */
function BookStatus({ book }: { book: any }) {
  const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip px-2 py-0.5 text-meta font-medium';

  if (book.status === 'PROCESSING') {
    return (
      <span className={cn(base, 'bg-info-bg text-info')}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
        Processing
      </span>
    );
  }
  if (book.status === 'FAILED') {
    return (
      <div className="space-y-1">
        <span className={cn(base, 'bg-danger-bg text-danger')}>
          <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Failed
        </span>
        {book.errorMessage && <p className="max-w-xs text-meta text-ink-subtle">{book.errorMessage}</p>}
      </div>
    );
  }
  if (book.textStatus === 'UNREADABLE') {
    return (
      <div className="space-y-1">
        <span className={cn(base, 'bg-warning-bg text-warning')}>
          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Reading only
        </span>
        {book.errorMessage && <p className="max-w-xs text-meta text-ink-subtle">{book.errorMessage}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <span className={cn(base, 'bg-success-bg text-success')}>
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        Ready for AI
      </span>
      {book.errorMessage && <p className="max-w-xs text-meta text-ink-subtle">{book.errorMessage}</p>}
    </div>
  );
}
