'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, MoreHorizontal, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
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
import { apiErrorMessage, cn, formatDate } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';

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
  teacherId: '',
  degree: '',
  specialization: '',
  phone: '',
  joiningDate: '',
  status: 'ACTIVE',
};

const VIEW_KEY = 'schoolos.teachers.view';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_KEY);
      if (stored === 'grid' || stored === 'list') setView(stored);
    } catch {
      /* blocked storage is fine; the default stands */
    }
  }, []);

  const setViewPersisted = (next: 'grid' | 'list') => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getTeachers({ search })
      .then((r) => setTeachers(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load teachers');
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    adminAPI
      .getAssignments()
      .then((r) => setAssignments((r.data.data ?? []).filter((a: any) => a.isActive !== false)))
      .catch(() => {});
  }, []);

  /**
   * Teachers by the subject they actually teach (from their class
   * assignments) — a maths teacher appears under Mathematics, with the
   * classes they take. Someone teaching two subjects appears under both.
   */
  const bySubject = useMemo(() => {
    const sections = new Map<string, { subject: any; teachers: { t: any; classes: string[] }[] }>();
    const unassigned: any[] = [];
    for (const t of teachers) {
      const mine = assignments.filter((a) => (a.teacherId?._id ?? a.teacherId) === t._id);
      if (!mine.length) {
        unassigned.push(t);
        continue;
      }
      const subjectIds = Array.from(new Set(mine.map((a) => a.subjectId?._id)));
      for (const sid of subjectIds) {
        const rows = mine.filter((a) => a.subjectId?._id === sid);
        if (!sections.has(sid)) sections.set(sid, { subject: rows[0].subjectId, teachers: [] });
        const classes = rows
          .map((a) => a.classId)
          .filter(Boolean)
          .sort((x: any, y: any) => (x.gradeNumber ?? 0) - (y.gradeNumber ?? 0))
          .map((c: any) => `${c.name?.replace('Class ', '')}${c.section ? c.section : ''}`);
        sections.get(sid)!.teachers.push({ t, classes });
      }
    }
    const list = Array.from(sections.values()).sort((a, b) => (a.subject?.name ?? '').localeCompare(b.subject?.name ?? ''));
    return { list, unassigned };
  }, [teachers, assignments]);

  const subjectsTaught = (id: string) =>
    Array.from(new Set(assignments.filter((a) => (a.teacherId?._id ?? a.teacherId) === id).map((a) => a.subjectId?.name))).filter(Boolean);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      username: t.userId?.username || '',
      email: t.email || '',
      password: '',
      fullName: t.fullName,
      teacherId: t.teacherId,
      degree: t.degree || '',
      specialization: t.specialization || '',
      phone: t.phone || '',
      joiningDate: t.joiningDate?.slice(0, 10) || '',
      status: t.status,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateTeacher(editing._id, withoutBlanks(form));
        toast.success('Teacher saved');
      } else {
        await adminAPI.createTeacher(withoutBlanks(form));
        toast.success(`${form.fullName} added`);
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the teacher'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteTeacher(deleting._id);
      toast.success(`${deleting.fullName} deactivated`);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not deactivate the teacher'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teachers"
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Add a teacher
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
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search teachers"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!loading && (
            <p className="text-meta text-ink-subtle tabular">
              {teachers.length} {teachers.length === 1 ? 'teacher' : 'teachers'}
            </p>
          )}
          <div className="flex rounded-btn border border-line p-0.5">
            <ViewButton
              active={view === 'grid'}
              onClick={() => setViewPersisted('grid')}
              label="Card view"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </ViewButton>
            <ViewButton
              active={view === 'list'}
              onClick={() => setViewPersisted('list')}
              label="List view"
            >
              <List className="h-4 w-4" strokeWidth={1.75} />
            </ViewButton>
          </div>
        </div>
      </div>

      {!loading && bySubject.list.length > 0 && (
        <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by subject">
          {[
            { id: 'all', label: 'All subjects', n: teachers.length },
            ...bySubject.list.map((sec) => ({ id: sec.subject?._id, label: sec.subject?.name, n: sec.teachers.length })),
            ...(bySubject.unassigned.length ? [{ id: 'none', label: 'Not assigned', n: bySubject.unassigned.length }] : []),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={subjectFilter === c.id}
              onClick={() => setSubjectFilter(c.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-dense font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                subjectFilter === c.id ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
              )}
            >
              {c.label}
              <span className={cn('text-meta tabular', subjectFilter === c.id ? 'opacity-80' : 'text-ink-subtle')}>{c.n}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        view === 'grid' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-card" />
            ))}
          </div>
        ) : (
          <TableSkeleton cols={5} />
        )
      ) : failed ? (
        <ErrorState description="The teacher directory did not load." onRetry={load} />
      ) : !teachers.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Users}
            title={search ? 'No teachers match that search' : 'No teachers yet'}
            description={search ? 'Try a different name or ID.' : 'Add the first teacher to get started.'}
            action={
              search ? (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Add a teacher
                </Button>
              )
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="space-y-8">
          {bySubject.list
            .filter((sec) => subjectFilter === 'all' || sec.subject?._id === subjectFilter)
            .map((sec) => (
              <section key={sec.subject?._id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-meta font-bold text-ink', subjectTint(sec.subject))}>
                    {sec.subject?.code}
                  </span>
                  <div>
                    <h2 className="text-section text-ink">{sec.subject?.name}</h2>
                    <p className="text-meta text-ink-muted">
                      {sec.subject?.nameBn && (
                        <span lang="bn" className="font-bn">
                          {sec.subject.nameBn} ·{' '}
                        </span>
                      )}
                      {sec.teachers.length} {sec.teachers.length === 1 ? 'teacher' : 'teachers'}
                    </p>
                  </div>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sec.teachers.map(({ t, classes }) => (
                    <li key={t._id}>
                      <TeacherCard t={t} classes={classes} onEdit={() => openEdit(t)} onDelete={() => setDeleting(t)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          {bySubject.unassigned.length > 0 && (subjectFilter === 'all' || subjectFilter === 'none') && (
            <section className="space-y-3">
              <div>
                <h2 className="text-section text-ink">Not teaching a class yet</h2>
                <p className="text-meta text-ink-muted">Assign them a subject on a class page.</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bySubject.unassigned.map((t) => (
                  <li key={t._id}>
                    <TeacherCard t={t} classes={[]} onEdit={() => openEdit(t)} onDelete={() => setDeleting(t)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Teacher ID</TableHead>
                <TableHead className="hidden md:table-cell">Degree</TableHead>
                <TableHead className="hidden lg:table-cell">Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers
                .filter((t: any) => subjectFilter === 'all' || (subjectFilter === 'none' ? !subjectsTaught(t._id).length : assignments.some((a) => (a.teacherId?._id ?? a.teacherId) === t._id && a.subjectId?._id === subjectFilter)))
                .map((t: any) => (
                <TableRow key={t._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar name={t.fullName} src={t.photoUrl} className="h-8 w-8" />
                      <span className="truncate font-medium text-ink">{t.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-ink-muted">{t.teacherId}</TableCell>
                  <TableCell className="hidden md:table-cell text-ink-muted">{t.degree || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-ink-muted">
                    {subjectsTaught(t._id).join(', ') || t.specialization || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell tabular text-ink-muted">
                    {t.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={t.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <TeacherMenu
                        onEdit={() => openEdit(t)}
                        onDelete={() => setDeleting(t)}
                        name={t.fullName}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit teacher' : 'Add a teacher'}</SheetTitle>
            <SheetDescription>
              {editing ? editing.fullName : 'Creates the staff record and their sign-in account.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {!editing && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Username" required>
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
                    <Field label="Password" required>
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
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      required
                    />
                  )}
                </Field>
                <Field label="Teacher ID" required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.teacherId}
                      onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                      required
                    />
                  )}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Degree" description="As it should appear in the directory.">
                  {(p) => (
                    <Input
                      {...p}
                      value={form.degree}
                      onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
                      placeholder="M.Sc., B.Ed."
                    />
                  )}
                </Field>
                <Field label="Subject">
                  {(p) => (
                    <Input
                      {...p}
                      value={form.specialization}
                      onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                      placeholder="Mathematics"
                    />
                  )}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  {(p) => (
                    <Input
                      {...p}
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  )}
                </Field>
                <Field label="Email">
                  {(p) => (
                    <Input
                      {...p}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  )}
                </Field>
              </div>

              <Field label="Joining date">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                  />
                )}
              </Field>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? 'Save changes' : 'Add teacher'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Deactivate this teacher?"
        description={
          <>
            <strong className="text-ink">{deleting?.fullName}</strong> ({deleting?.teacherId}) will be
            marked inactive, their sign-in disabled and their class assignments ended. Past
            attendance, homework and marks are kept.
          </>
        }
        confirmLabel="Deactivate"
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-chip transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        active ? 'bg-wash text-brand' : 'text-ink-subtle hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

function TeacherMenu({
  onEdit,
  onDelete,
  name,
}: {
  onEdit: () => void;
  onDelete: () => void;
  name: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeacherCard({ t, classes, onEdit, onDelete }: { t: any; classes: string[]; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <PersonAvatar name={t.fullName} src={t.photoUrl} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-dense font-semibold text-ink">{t.fullName}</p>
          <p className="truncate text-meta text-ink-subtle tabular">{t.teacherId}</p>
        </div>
        <TeacherMenu onEdit={onEdit} onDelete={onDelete} name={t.fullName} />
      </div>
      <div className="mt-3 flex-1 space-y-2">
        {t.degree && <p className="truncate text-meta text-ink-muted">{t.degree}</p>}
        {classes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {classes.map((c) => (
              <span key={c} className="rounded-chip bg-wash px-1.5 py-0.5 text-meta font-medium text-brand tabular">
                Class {c}
              </span>
            ))}
          </div>
        ) : (
          t.specialization && <span className="inline-flex rounded-chip bg-surface-sunken px-2 py-0.5 text-meta text-ink-muted">{t.specialization}</span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <StatusPill status={t.status} />
        {t.phone && <span className="truncate text-meta text-ink-subtle tabular">{t.phone}</span>}
      </div>
    </Card>
  );
}
