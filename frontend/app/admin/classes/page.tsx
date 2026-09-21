'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Grid3X3, Pencil, MoreHorizontal, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
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

const emptyForm = { name: '', section: '', room: '', capacity: 40 };

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getClasses()
      .then((r) => setClasses(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load classes');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      section: c.section ?? '',
      room: c.room ?? '',
      capacity: c.capacity ?? 40,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateClass(editing._id, form);
        toast.success('Class saved');
      } else {
        await adminAPI.createClass(form);
        toast.success(`${form.name} ${form.section} created`.trim());
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the class'));
    } finally {
      setSaving(false);
    }
  };

  const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrollmentCount ?? 0), 0);
  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity ?? 40), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Classes"
        description={
          classes.length
            ? `${totalEnrolled} of ${totalCapacity} places filled across ${classes.length} classes`
            : undefined
        }
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Add a class
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton cols={4} />
      ) : failed ? (
        <ErrorState description="The class list did not load." onRetry={load} />
      ) : !classes.length ? (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={Grid3X3}
            title="No classes yet"
            description="Create Class 3 through Class 10 so students can be admitted."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Add a class
              </Button>
            }
          />
        </div>
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Class</TableHead>
                <TableHead className="hidden sm:table-cell">Room</TableHead>
                <TableHead className="w-56">Enrolment</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c: any) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <Link
                      href={`/admin/classes/${c._id}`}
                      className="font-medium text-ink hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {c.name} {c.section}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-ink-muted">
                    {c.room || '—'}
                  </TableCell>
                  <TableCell>
                    <CapacityBar
                      enrolled={c.enrollmentCount ?? 0}
                      capacity={c.capacity ?? 40}
                      className="max-w-[12rem]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${c.name} ${c.section}`}
                            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/classes/${c._id}`}>
                              <Eye className="h-4 w-4" strokeWidth={1.75} />
                              View class
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                            Edit
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
            <SheetTitle>{editing ? 'Edit class' : 'Add a class'}</SheetTitle>
            <SheetDescription>
              {editing ? `${editing.name} ${editing.section}` : 'Classes 3 to 10, one section each.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Class 7"
                      required
                    />
                  )}
                </Field>
                <Field label="Section" required>
                  {(p) => (
                    <Input
                      {...p}
                      value={form.section}
                      onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                      placeholder="A"
                      required
                    />
                  )}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Room">
                  {(p) => (
                    <Input
                      {...p}
                      value={form.room}
                      onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                      placeholder="Room 107"
                    />
                  )}
                </Field>
                <Field label="Capacity" description="The school caps a class at 40." required>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={1}
                      max={40}
                      value={form.capacity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 0 }))
                      }
                      required
                    />
                  )}
                </Field>
              </div>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? 'Save changes' : 'Add class'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
