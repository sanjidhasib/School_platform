'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Bell, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
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
import { apiErrorMessage, formatDate } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { tNode } from '@/lib/i18n/node';

const today = () => new Date().toISOString().split('T')[0];
const CATEGORIES = ['GENERAL', 'ACADEMIC', 'EXAM', 'HOLIDAY', 'EVENT', 'URGENT'] as const;
const categoryLabel = (c: string) =>
  c.charAt(0) + c.slice(1).toLowerCase();

const emptyForm = {
  title: '',
  description: '',
  category: 'GENERAL',
  publishDate: '',
  eventDate: '',
};

/**
 * The school notice board, kept close to the real thing: a dated stack of
 * notices, newest first, each one readable without opening anything.
 */
export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
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
      .getNotices()
      .then((r) => setNotices(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load notices'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, publishDate: today() });
    setOpen(true);
  };

  const openEdit = (n: any) => {
    setEditing(n);
    setForm({
      title: n.title ?? '',
      description: n.description ?? '',
      category: n.category ?? 'GENERAL',
      publishDate: (n.publishAt ?? n.publishDate ?? '').slice(0, 10),
      eventDate: (n.eventDate ?? '').slice(0, 10),
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        // The school notice board is read by everyone.
        audienceType: 'ALL',
        publishAt: form.publishDate || new Date().toISOString().slice(0, 10),
        isPublished: true,
      };
      if (form.eventDate) payload.eventDate = form.eventDate;
      if (editing) {
        await adminAPI.updateNotice(editing._id, payload);
        toast.success(t('Notice updated'));
      } else {
        await adminAPI.createNotice(payload);
        toast.success(t('Notice published'));
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not publish the notice')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteNotice(deleting._id);
      toast.success(t('Notice deleted'));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not delete the notice')));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Notices')}
        description={t('Published notices reach students, guardians and the school home page.')}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            {t('Write a notice')}
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : failed ? (
        <ErrorState description={t('The notice board did not load.')} onRetry={load} />
      ) : !notices.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Bell}
            title={t('Nothing on the notice board')}
            description={t('Publish a notice and it appears here and on the school home page.')}
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                {t('Write a notice')}
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
          {notices.map((n: any) => {
            const upcoming = n.eventDate && new Date(n.eventDate) >= new Date();
            return (
              <li key={n._id} className="flex gap-4 px-4 py-4">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-meta uppercase text-ink-subtle">
                    {formatDate(n.eventDate || n.publishAt || n.createdAt).split(' ')[1]}
                  </p>
                  <p className="text-xl font-semibold text-ink tabular">
                    {formatDate(n.eventDate || n.publishAt || n.createdAt).split(' ')[0]}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-dense font-semibold text-ink">{n.title}</h2>
                    {upcoming && <Badge tone="warning">{t('Upcoming event')}</Badge>}
                    {n.category && <Badge tone="outline">{n.category}</Badge>}
                  </div>
                  {n.description && (
                    <p className="mt-1 whitespace-pre-line text-dense text-ink-muted">
                      {n.description}
                    </p>
                  )}
                  <p className="mt-2 text-meta text-ink-subtle">
                    {t('Published {formatDate}', { formatDate: formatDate(n.publishAt || n.createdAt) })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={t('Actions for {title}', { title: n.title })}>
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(n)}>
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      {t('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onSelect={() => setDeleting(n)}>
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      {t('Delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? t('Edit notice') : t('Write a notice')}</SheetTitle>
            <SheetDescription>
              {t('Give an event date and it also appears under upcoming events.')}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label={t('Title')} required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={t('Parent-teacher meeting')}
                    required
                  />
                )}
              </Field>

              <Field label={t('Category')} required>
                {(p) => (
                  <Combobox
                    {...p}
                    options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))}
                    value={form.category}
                    onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    searchPlaceholder={t('Find a category')}
                  />
                )}
              </Field>

              <Field label={t('Notice')} required>
                {(p) => (
                  <Textarea
                    {...p}
                    rows={6}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Publish on')} required>
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      value={form.publishDate}
                      onChange={(e) => setForm((f) => ({ ...f, publishDate: e.target.value }))}
                      required
                    />
                  )}
                </Field>
                <Field label={t('Event date')} description={t('Optional.')}>
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? t('Save changes') : t('Publish')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('Delete this notice?')}
        description={
          tNode('{name} will be removed from the notice board and from the school home page.', { name: <strong className="text-ink">{deleting?.title}</strong> })
        }
        confirmLabel={t('Delete')}
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
