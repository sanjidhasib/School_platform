'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, BookOpen, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
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
import { subjectTint } from '@/lib/design/subjects';
import { cn } from '@/lib/utils';

const emptyForm = { name: '', nameBn: '', code: '', description: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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
      .getSubjects()
      .then((r) => setSubjects(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load subjects');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name ?? '',
      nameBn: s.nameBn ?? '',
      code: s.code ?? '',
      description: s.description ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateSubject(editing._id, form);
        toast.success('Subject saved');
      } else {
        await adminAPI.createSubject(form);
        toast.success(`${form.name} created`);
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the subject'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteSubject(deleting._id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the subject'));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subjects"
        description="The Bangla name appears beside the English one throughout the app."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Add a subject
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton cols={4} />
      ) : failed ? (
        <ErrorState description="The subject list did not load." onRetry={load} />
      ) : !subjects.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Add the subjects this school teaches."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Add a subject
              </Button>
            }
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s: any) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-chip px-2 py-0.5 text-meta font-semibold text-ink',
                        subjectTint(s)
                      )}
                    >
                      {s.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium text-ink">{s.name}</span>
                    {s.nameBn && (
                      <span lang="bn" className="block font-bn text-meta text-ink-muted">
                        {s.nameBn}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-ink-muted">
                    {s.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${s.name}`}
                            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onSelect={() => setDeleting(s)}>
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit subject' : 'Add a subject'}</SheetTitle>
            <SheetDescription>
              {editing ? editing.name : 'Give both names so the app can show Bangla alongside English.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label="English name" required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Mathematics"
                    required
                  />
                )}
              </Field>

              <Field label="Bangla name" description="Shown under the English name across the app.">
                {(p) => (
                  <Input
                    {...p}
                    lang="bn"
                    className="font-bn"
                    value={form.nameBn}
                    onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))}
                    placeholder="গণিত"
                  />
                )}
              </Field>

              <Field label="Code" description="Three letters. Also picks the subject's colour." required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="MAT"
                    maxLength={8}
                    required
                  />
                )}
              </Field>

              <Field label="Description">
                {(p) => (
                  <Input
                    {...p}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                )}
              </Field>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? 'Save changes' : 'Add subject'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this subject?"
        description={
          <>
            <strong className="text-ink">{deleting?.name}</strong> ({deleting?.code}) will be removed.
            Assessments, assignments and routine entries that reference it may be affected.
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
