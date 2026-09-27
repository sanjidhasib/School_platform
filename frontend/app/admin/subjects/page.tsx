'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, BookOpen, Pencil, MoreHorizontal, Sparkles, Check, MinusCircle, Library } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PersonAvatar } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { apiErrorMessage, cn } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';
import { t } from '@/lib/i18n';
import { tNode } from '@/lib/i18n/node';
import { num } from '@/lib/i18n';

const emptyForm = { name: '', nameBn: '', code: '', description: '' };

/**
 * Subjects, class by class — the way NCTB lays them out. Each class shows
 * what it studies and who teaches it; the NCTB list for that class can be
 * previewed and added in one go.
 */
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grade, setGrade] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [curriculum, setCurriculum] = useState<any>(null);
  const [nctbOpen, setNctbOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([adminAPI.getSubjects(), adminAPI.getClasses(), adminAPI.getAssignments()])
      .then(([s, c, a]) => {
        setSubjects(s.data.data ?? []);
        const cls = (c.data.data ?? []).sort((x: any, y: any) => x.gradeNumber - y.gradeNumber);
        setClasses(cls);
        setAssignments((a.data.data ?? []).filter((x: any) => x.isActive !== false));
        setGrade((g) => g ?? cls[0]?.gradeNumber ?? null);
      })
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load subjects'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const grades = useMemo(() => Array.from(new Set(classes.map((c) => c.gradeNumber))).sort((a, b) => a - b), [classes]);
  const classIdsOfGrade = useMemo(
    () => new Set(classes.filter((c) => c.gradeNumber === grade).map((c) => String(c._id))),
    [classes, grade]
  );
  const inGrade = useMemo(
    () =>
      subjects
        .filter((s) => (s.classIds ?? []).some((id: any) => classIdsOfGrade.has(String(id?._id ?? id))))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subjects, classIdsOfGrade]
  );
  const teachersOf = (subjectId: string) =>
    assignments.filter((a) => a.subjectId?._id === subjectId && classIdsOfGrade.has(String(a.classId?._id)));

  const openNctb = async () => {
    if (grade === null) return;
    setNctbOpen(true);
    setCurriculum(null);
    try {
      const r = await adminAPI.getCurriculum(grade);
      setCurriculum(r.data.data);
      setPicked(new Set(r.data.data.items.filter((i: any) => i.status !== 'IN_CLASS' && i.group === 'Compulsory').map((i: any) => i.code)));
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not load the NCTB list')));
      setNctbOpen(false);
    }
  };

  const applyNctb = async () => {
    if (grade === null) return;
    setApplying(true);
    try {
      const r = await adminAPI.applyCurriculum(grade, Array.from(picked));
      const { created, added } = r.data.data;
      toast.success(t('Class {grade}: {value} {value2} added', { grade, value: created + added, value2: created + added === 1 ? 'subject' : 'subjects' }));
      setNctbOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not add the subjects')));
    } finally {
      setApplying(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name ?? '', nameBn: s.nameBn ?? '', code: s.code ?? '', description: s.description ?? '' });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateSubject(editing._id, form);
        toast.success(t('Subject saved'));
      } else {
        // A new subject is added to the class being viewed.
        const ids = classes.filter((c) => c.gradeNumber === grade).map((c) => c._id);
        await adminAPI.createSubject({ ...form, classIds: ids });
        toast.success(t('{name} added to Class {grade}', { name: form.name, grade }));
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not save the subject')));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (grade === null) return;
    setBusy(true);
    try {
      await adminAPI.removeSubjectFromGrade(removing._id, grade);
      toast.success(t('{name} removed from Class {grade}', { name: removing.name, grade }));
      setRemoving(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not remove the subject')));
    } finally {
      setBusy(false);
    }
  };

  const groups = useMemo(() => {
    const items: any[] = curriculum?.items ?? [];
    const order = Array.from(new Set(items.map((i) => i.group)));
    return order.map((g) => ({ group: g, items: items.filter((i) => i.group === g) }));
  }, [curriculum]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Subjects')}
        description={t('What each class studies, following NCTB, and who teaches it.')}
        actions={
          <>
            <Button variant="secondary" onClick={openNctb} disabled={grade === null}>
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              {t('NCTB subjects')}
            </Button>
            <Button onClick={openAdd} disabled={grade === null}>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              {t('Add a subject')}
            </Button>
          </>
        }
      />

      {/* One tab per class */}
      <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('Class')}>
        {grades.map((g) => {
          const ids = new Set(classes.filter((c) => c.gradeNumber === g).map((c) => String(c._id)));
          const n = subjects.filter((s) => (s.classIds ?? []).some((id: any) => ids.has(String(id?._id ?? id)))).length;
          return (
            <button
              key={g}
              role="tab"
              aria-selected={grade === g}
              onClick={() => setGrade(g)}
              className={cn(
                'flex shrink-0 flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                grade === g ? 'border-brand bg-brand text-brand-contrast shadow-card' : 'border-line bg-surface hover:border-line-strong'
              )}
            >
              <span className={cn('text-dense font-semibold', grade !== g && 'text-ink')}>{t('Class {g}', { g })}</span>
              <span className={cn('text-meta', grade === g ? 'opacity-80' : 'text-ink-subtle')}>{t('{n} subjects', { n })}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[18px]" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState description={t('The subject list did not load.')} onRetry={load} />
      ) : !inGrade.length ? (
        <div className="rounded-[18px] border border-line bg-surface shadow-card">
          <EmptyState
            icon={BookOpen}
            title={t('No subjects for Class {grade} yet', { grade })}
            description={t('Add the NCTB subjects for this class in one go.')}
            action={
              <Button onClick={openNctb}>
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                {t('NCTB subjects')}
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {inGrade.map((s) => {
            const teachers = teachersOf(s._id);
            return (
              <li key={s._id} className="group flex overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
                <span className={cn('w-2 shrink-0', subjectTint(s))} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-meta font-bold text-ink', subjectTint(s))}>
                      {s.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold text-ink">{s.name}</p>
                      {s.nameBn && (
                        <p lang="bn" className="truncate font-bn text-dense text-ink-muted">
                          {s.nameBn}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={t('Actions for {name}', { name: s.name })}>
                          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem destructive onSelect={() => setRemoving(s)}>
                          <MinusCircle className="h-4 w-4" strokeWidth={1.75} />
                          {t('Remove from Class {grade}', { grade })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-auto border-t border-line pt-3">
                    {teachers.length ? (
                      <ul className="space-y-1.5">
                        {teachers.map((a) => (
                          <li key={a._id} className="flex items-center gap-2 text-dense">
                            <PersonAvatar name={a.teacherId?.fullName} className="h-6 w-6 text-[10px]" />
                            <span className="min-w-0 flex-1 truncate text-ink">{a.teacherId?.fullName}</span>
                            {classIdsOfGrade.size > 1 && <span className="text-meta text-ink-subtle">{a.classId?.section}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-meta text-warning">{t('No teacher yet — assign one on the class page.')}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* NCTB list for the class */}
      <Sheet open={nctbOpen} onOpenChange={(o) => !applying && setNctbOpen(o)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('NCTB subjects — Class {grade}', { grade })}</SheetTitle>
            <SheetDescription>{curriculum?.source ?? t('Loading…')}</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-5">
            {!curriculum ? (
              <Skeleton className="h-64 w-full rounded-card" />
            ) : (
              groups.map(({ group, items }) => (
                <div key={group}>
                  <p className="mb-2 text-meta font-semibold uppercase tracking-[0.12em] text-ink-subtle">{group}</p>
                  <ul className="space-y-1.5">
                    {items.map((i: any) => {
                      const already = i.status === 'IN_CLASS';
                      const on = already || picked.has(i.code);
                      return (
                        <li key={i.code}>
                          <label
                            className={cn(
                              'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                              already ? 'border-line bg-surface-sunken' : on ? 'cursor-pointer border-brand/40 bg-brand-wash' : 'cursor-pointer border-line hover:border-line-strong'
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                              checked={on}
                              disabled={already}
                              onChange={(e) =>
                                setPicked((p) => {
                                  const n = new Set(p);
                                  if (e.target.checked) n.add(i.code);
                                  else n.delete(i.code);
                                  return n;
                                })
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-dense font-medium text-ink">{i.name}</span>
                              <span lang="bn" className="block font-bn text-meta text-ink-muted">
                                {i.nameBn}
                              </span>
                            </span>
                            {already ? (
                              <span className="inline-flex items-center gap-1 text-meta text-success">
                                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                                {t('In class')}
                              </span>
                            ) : i.status === 'NEW' ? (
                              <span className="text-meta text-ink-subtle">{t('New subject')}</span>
                            ) : null}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
            {curriculum && (
              <p className="flex items-start gap-2 rounded-xl bg-surface-sunken px-3 py-2 text-meta text-ink-muted">
                <Library className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {t('Subjects the school already has keep their names; new ones are created with the NCTB name. Group subjects (9–10) apply to the whole class — untick those your school doesn’t offer.')}
              </p>
            )}
          </SheetBody>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setNctbOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={applyNctb} loading={applying} disabled={!picked.size}>
              {t('Add')}{' '}{picked.size || ''}{' '}{t('to Class {grade}', { grade })}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add / edit */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? t('Edit subject') : t('Add a subject to Class {grade}', { grade })}</SheetTitle>
            <SheetDescription>
              {editing ? t('Changes apply in every class that studies it.') : t('For a subject that isn’t on the NCTB list.')}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              <Field label={t('English name')} required>
                {(p) => <Input {...p} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('Mathematics')} required />}
              </Field>
              <Field label={t('Bangla name')} description={t('Shown under the English name across the app.')}>
                {(p) => (
                  <Input {...p} lang="bn" className="font-bn" value={form.nameBn} onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))} placeholder="গণিত" />
                )}
              </Field>
              <Field label={t('Code')} description={t('A short unique code, e.g. MAT.')} required>
                {(p) => (
                  <Input {...p} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder={t('MAT')} maxLength={8} required />
                )}
              </Field>
              <Field label={t('Description')}>
                {(p) => <Input {...p} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
              </Field>
            </SheetBody>
            <SheetFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? t('Save changes') : t('Add subject')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t('Remove from Class {grade}?', { grade })}
        description={
          tNode('{name} will no longer be studied in Class {grade}. Other classes keep it.', { name: <strong className="text-ink">{removing?.name}</strong>, grade: num(grade) })
        }
        confirmLabel={t('Remove')}
        destructive
        loading={busy}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
