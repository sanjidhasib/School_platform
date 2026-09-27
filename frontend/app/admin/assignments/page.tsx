'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ClipboardList, Trash2, MoreHorizontal, Pencil, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PersonAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
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
import { subjectBn } from '@/lib/design/subjects';

const emptyForm = { teacherId: '', classId: '', subjectId: '' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  /** The 409 the backend returns for a duplicate, shown inline in the sheet. */
  const [conflict, setConflict] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getAssignments()
      .then((r) => setAssignments(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load assignments');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    adminAPI.getTeachers().then((r) => setTeachers(r.data.data)).catch(() => setTeachers([]));
    adminAPI.getClasses().then((r) => setClasses(r.data.data)).catch(() => setClasses([]));
    adminAPI.getSubjects().then((r) => setSubjects(r.data.data)).catch(() => setSubjects([]));
  }, [load]);

  const teacherOptions = useMemo(
    () =>
      teachers.map((t: any) => ({
        value: t._id,
        label: t.fullName,
        hint: [t.teacherId, t.specialization].filter(Boolean).join(' · '),
      })),
    [teachers]
  );

  const classOptions = useMemo(
    () =>
      classes.map((c: any) => ({
        value: c._id,
        label: `${c.name} ${c.section ?? ''}`.trim(),
        hint: c.room || undefined,
      })),
    [classes]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map((s: any) => ({
        value: s._id,
        label: s.name,
        hint: subjectBn(s) ?? s.code,
      })),
    [subjects]
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setConflict(null);
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      teacherId: a.teacherId?._id ?? '',
      classId: a.classId?._id ?? '',
      subjectId: a.subjectId?._id ?? '',
    });
    setConflict(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflict(null);
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateAssignment(editing._id, form);
        toast.success('Assignment saved');
      } else {
        await adminAPI.createAssignment(form);
        toast.success('Teacher assigned');
      }
      setOpen(false);
      load();
    } catch (err) {
      const message = apiErrorMessage(err, 'Could not save the assignment');
      setConflict(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteAssignment(deleting._id);
      toast.success('Assignment removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove the assignment'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        description="Which teacher takes which subject, in which class."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Assign a teacher
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton cols={4} />
      ) : failed ? (
        <ErrorState description="The assignment list did not load." onRetry={load} />
      ) : !assignments.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={ClipboardList}
            title="No assignments yet"
            description="Assign a teacher to a subject in a class before building the routine."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Assign a teacher
              </Button>
            }
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a: any) => (
                <TableRow key={a._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar name={a.teacherId?.fullName} className="h-8 w-8" />
                      <span className="truncate font-medium text-ink">
                        {a.teacherId?.fullName ?? '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {a.classId ? `${a.classId.name} ${a.classId.section ?? ''}`.trim() : '—'}
                  </TableCell>
                  <TableCell>
                    <SubjectLabel subject={a.subjectId} className="text-ink" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${a.teacherId?.fullName}`}
                            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(a)}>
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onSelect={() => setDeleting(a)}>
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                            Remove
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit assignment' : 'Assign a teacher'}</SheetTitle>
            <SheetDescription>
              A teacher can take the same subject in several classes.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {conflict && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-bg px-3 py-2.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                  <p className="text-dense text-danger">{conflict}</p>
                </div>
              )}

              <Field label="Teacher" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={teacherOptions}
                    value={form.teacherId}
                    onChange={(v) => setForm((f) => ({ ...f, teacherId: v }))}
                    placeholder="Choose a teacher"
                    searchPlaceholder="Find a teacher"
                  />
                )}
              </Field>

              <Field label="Class" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={classOptions}
                    value={form.classId}
                    onChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                    placeholder="Choose a class"
                    searchPlaceholder="Find a class"
                  />
                )}
              </Field>

              <Field label="Subject" required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={subjectOptions}
                    value={form.subjectId}
                    onChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
                    placeholder="Choose a subject"
                    searchPlaceholder="Find a subject"
                  />
                )}
              </Field>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={!form.teacherId || !form.classId || !form.subjectId}
              >
                {editing ? 'Save changes' : 'Assign teacher'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove this assignment?"
        description={
          <>
            <strong className="text-ink">{deleting?.teacherId?.fullName}</strong> will no longer take{' '}
            <strong className="text-ink">{deleting?.subjectId?.name}</strong> in{' '}
            <strong className="text-ink">
              {deleting?.classId?.name} {deleting?.classId?.section}
            </strong>
            . Routine entries that use this assignment may stop resolving.
          </>
        }
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
