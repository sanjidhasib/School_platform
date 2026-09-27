'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, GraduationCap, MoreHorizontal, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { CapacityBar } from '@/components/ui/progress';
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
import { apiErrorMessage } from '@/lib/utils';
import { t as tr } from '@/lib/i18n';
import { tNode } from '@/lib/i18n/node';

/**
 * Optional fields left blank must be omitted, not sent as "". The User model
 * has a unique index on email, so an empty string collides with the next
 * record that also has none.
 */
function withoutBlanks<T extends Record<string, any>>(form: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ) as Partial<T>;
}

const emptyForm = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  studentId: '',
  classId: '',
  phone: '',
  status: 'ACTIVE',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getStudents({ search, classId: classFilter === 'all' ? undefined : classFilter, limit })
      .then((r) => {
        setStudents(r.data.data);
        setTotal(r.data.pagination?.total ?? r.data.data.length);
      })
      .catch(() => {
        setFailed(true);
        toast.error(tr('Could not load students'));
      })
      .finally(() => setLoading(false));
  }, [search, classFilter, limit]);

  useEffect(() => {
    setLimit(20);
  }, [search, classFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    adminAPI
      .getClasses()
      .then((r) => setClasses(r.data.data))
      .catch(() => setClasses([]));
  }, []);

  /**
   * The school caps every class at 40 and the backend rejects an admission past
   * it with a 409. The picker now says so before the form is submitted: a full
   * class is listed, disabled, and explains why.
   */
  const classOptions = useMemo(
    () =>
      classes.map((c: any) => {
        const enrolled = c.enrollmentCount ?? 0;
        const capacity = c.capacity ?? 40;
        const full = enrolled >= capacity;
        // Editing a student already in a full class must not lock them out of it.
        const isCurrent = editing?.classId?._id === c._id;
        return {
          value: c._id,
          label: `${c.name} ${c.section}`.trim(),
          hint: tr('{enrolled} of {capacity} places filled', { enrolled, capacity }),
          disabled: full && !isCurrent,
          disabledReason: full && !isCurrent ? tr('Full — {enrolled} of {capacity} places taken', { enrolled, capacity }) : undefined,
        };
      }),
    [classes, editing]
  );

  const selectedClass = classes.find((c: any) => c._id === form.classId);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      username: s.userId?.username || '',
      email: s.email || '',
      password: '',
      fullName: s.fullName,
      studentId: s.studentId,
      classId: s.classId?._id || '',
      phone: s.phone || '',
      status: s.status,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateStudent(editing._id, withoutBlanks(form));
        toast.success(tr('Student saved'));
      } else {
        await adminAPI.createStudent(withoutBlanks(form));
        toast.success(tr('{fullName} admitted', { fullName: form.fullName }));
      }
      setOpen(false);
      load();
      adminAPI.getClasses().then((r) => setClasses(r.data.data));
    } catch (err) {
      toast.error(apiErrorMessage(err, tr('Could not save the student')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteStudent(deleting._id);
      toast.success(tr('{fullName} deactivated', { fullName: deleting.fullName }));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, tr('Could not deactivate the student')));
    } finally {
      setRemoving(false);
    }
  };

  const activeFilterLabel =
    classFilter === 'all'
      ? null
      : classOptions.find((c) => c.value === classFilter)?.label ?? 'Class';

  return (
    <div className="space-y-5">
      <PageHeader
        title={tr('Students')}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            {tr('Admit a student')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            strokeWidth={1.75}
          />
          <Input
            placeholder={tr('Search by name or ID')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label={tr('Search students')}
          />
        </div>

        <div className="w-44">
          <Combobox
            options={[{ value: 'all', label: tr('All classes') }, ...classOptions.map((c) => ({ ...c, disabled: false, disabledReason: undefined }))]}
            value={classFilter}
            onChange={setClassFilter}
            placeholder={tr('All classes')}
            searchPlaceholder={tr('Find a class')}
          />
        </div>

        {activeFilterLabel && (
          <button
            type="button"
            onClick={() => setClassFilter('all')}
            className="inline-flex items-center gap-1 rounded-chip bg-wash px-2 py-1 text-meta font-medium text-brand transition-colors hover:bg-brand-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {activeFilterLabel}
            <X className="h-3 w-3" strokeWidth={2} />
            <span className="sr-only">{tr('Clear the class filter')}</span>
          </button>
        )}

        {!loading && (
          <p className="ml-auto text-meta text-ink-subtle tabular">
            {total > students.length
              ? tr('Showing {length} of {total} students', { length: students.length, total })
              : `${students.length} ${students.length === 1 ? 'student' : 'students'}`}
          </p>
        )}
      </div>

      {loading ? (
        <TableSkeleton cols={5} />
      ) : failed ? (
        <ErrorState description={tr('The student list did not load.')} onRetry={load} />
      ) : !students.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={GraduationCap}
            title={search || classFilter !== 'all' ? tr('No students match those filters') : tr('No students yet')}
            description={
              search || classFilter !== 'all'
                ? tr('Try a different name, ID or class.')
                : tr('Admit the first student to get started.')
            }
            action={
              search || classFilter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setClassFilter('all');
                  }}
                >
                  {tr('Clear filters')}
                </Button>
              ) : (
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  {tr('Admit a student')}
                </Button>
              )
            }
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{tr('Name')}</TableHead>
                <TableHead>{tr('Student ID')}</TableHead>
                <TableHead>{tr('Class')}</TableHead>
                <TableHead className="hidden md:table-cell">{tr('Guardian')}</TableHead>
                <TableHead>{tr('Status')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s: any) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar name={s.fullName} src={s.photoUrl} className="h-8 w-8" />
                      <Link
                        href={`/admin/students/${s._id}`}
                        className="truncate font-medium text-ink hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        {s.fullName}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-ink-muted">{s.studentId}</TableCell>
                  <TableCell className="text-ink-muted">
                    {s.classId ? `${s.classId.name} ${s.classId.section ?? ''}`.trim() : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-ink-muted">
                    {s.guardianIds?.[0]?.fullName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={s.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={tr('Actions for {fullName}', { fullName: s.fullName })}
                            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/students/${s._id}`}>
                              <Eye className="h-4 w-4" strokeWidth={1.75} />
                              {tr('View profile')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            {tr('Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onSelect={() => setDeleting(s)}>
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                            {tr('Deactivate')}
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

      {/* The list starts at 20; the rest of the school is one click away. */}
      {!loading && !failed && total > students.length && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + 40)}>
            {tr('Show more students')}
          </Button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? tr('Edit student') : tr('Admit a student')}</SheetTitle>
            <SheetDescription>
              {editing ? editing.fullName : tr('Creates the student record and their sign-in account.')}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {!editing && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={tr('Username')} required>
                      {(p) => (
                        <Input
                          {...p}
                          value={form.username}
                          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                          autoComplete="off"
                          required
                        />
                      )}
                    </Field>
                    <Field label={tr('Password')} required>
                      {(p) => (
                        <Input
                          {...p}
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                          autoComplete="new-password"
                          required
                        />
                      )}
                    </Field>
                  </div>
                  <Field label={tr('Email')}>
                    {(p) => (
                      <Input
                        {...p}
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    )}
                  </Field>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr('Full name')} required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      required
                    />
                  )}
                </Field>
                <Field label={tr('Student ID')} required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.studentId}
                      onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                      required
                    />
                  )}
                </Field>
              </div>

              <Field
                label={tr('Class')}
                description={tr('Classes that already hold 40 students cannot take another.')}
                required
              >
                {(p) => (
                  <Combobox
                    {...p}
                    options={classOptions}
                    value={form.classId}
                    onChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                    placeholder={tr('Choose a class')}
                    searchPlaceholder={tr('Find a class')}
                  />
                )}
              </Field>

              {selectedClass && (
                <CapacityBar
                  enrolled={selectedClass.enrollmentCount ?? 0}
                  capacity={selectedClass.capacity ?? 40}
                />
              )}

              <Field label={tr('Phone')}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                )}
              </Field>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {tr('Cancel')}
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? tr('Save changes') : tr('Admit student')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={tr('Deactivate this student?')}
        description={
          tNode('{name} ({id}) will be marked inactive and will no longer be able to sign in. Their attendance, homework and results are kept.', {
            name: <strong className="text-ink">{deleting?.fullName}</strong>,
            id: deleting?.studentId,
          })
        }
        confirmLabel={tr('Deactivate')}
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
