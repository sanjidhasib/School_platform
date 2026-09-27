'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trophy, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
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

const emptyForm = { title: '', description: '', achievementDate: '', imageUrl: '' };

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
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
      .getAchievements()
      .then((r) => setAchievements(r.data.data))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load achievements'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, achievementDate: new Date().toISOString().split('T')[0] });
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      title: a.title ?? '',
      description: a.description ?? '',
      achievementDate: (a.achievementDate ?? '').slice(0, 10),
      imageUrl: a.imageUrl ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateAchievement(editing._id, form);
        toast.success(t('Achievement saved'));
      } else {
        await adminAPI.createAchievement(form);
        toast.success(t('Achievement added'));
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not save the achievement')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteAchievement(deleting._id);
      toast.success(t('Achievement deleted'));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not delete the achievement')));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Achievements')}
        description={t('These appear on the school home page.')}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            {t('Add an achievement')}
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState description={t('The achievement list did not load.')} onRetry={load} />
      ) : !achievements.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={Trophy}
            title={t('No achievements recorded')}
            description={t('Record what the school has won so it shows on the home page.')}
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                {t('Add an achievement')}
              </Button>
            }
          />
        </div>
      ) : (
        /* Cards are right here: each one is a distinct, real thing. */
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a: any) => (
            <li key={a._id}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-meta text-ink-subtle tabular">{formatDate(a.achievementDate)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={t('Actions for {title}', { title: a.title })}>
                        <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        {t('Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onSelect={() => setDeleting(a)}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h2 className="mt-1 text-dense font-semibold text-ink">{a.title}</h2>
                {a.description && (
                  <p className="mt-1 flex-1 text-dense text-ink-muted">{a.description}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? t('Edit achievement') : t('Add an achievement')}</SheetTitle>
            <SheetDescription>{t('Shown on the school home page, newest first.')}</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label={t('Title')} required>
                {(p) => (
                  <Input
                    {...p}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                )}
              </Field>

              <Field label={t('Description')} required>
                {(p) => (
                  <Textarea
                    {...p}
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                  />
                )}
              </Field>

              <Field label={t('Date')} required>
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={form.achievementDate}
                    onChange={(e) => setForm((f) => ({ ...f, achievementDate: e.target.value }))}
                    required
                  />
                )}
              </Field>

              <Field label={t('Photo URL')} description={t('Optional. Shown on the home page.')}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="/school-images/slide-1.jpg"
                  />
                )}
              </Field>
            </SheetBody>

            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? t('Save changes') : t('Add achievement')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('Delete this achievement?')}
        description={
          tNode('{name} will be removed from the school home page.', { name: <strong className="text-ink">{deleting?.title}</strong> })
        }
        confirmLabel={t('Delete')}
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
